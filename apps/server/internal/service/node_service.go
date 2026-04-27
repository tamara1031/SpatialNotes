package service

import (
	"context"

	"github.com/tamara1031/spatial-notes/apps/server/pkg/authctx"
)

// maxAncestorWalk caps how many ancestors MoveNode follows when checking for
// cycles. It guards against pathologically deep or malformed parent chains
// (e.g. corrupt data that forms an undetected loop) so a single request can
// never hang the server. Real notebooks are nowhere near this depth.
const maxAncestorWalk = 1024

type NodeService struct {
	structureRepo  StructureRepository
	elementRepo    ElementRepository
	nodeUpdateRepo NodeUpdateRepository
}

func NewNodeService(
	structureRepo StructureRepository,
	elementRepo ElementRepository,
	nodeUpdateRepo NodeUpdateRepository,
) *NodeService {
	return &NodeService{
		structureRepo:  structureRepo,
		elementRepo:    elementRepo,
		nodeUpdateRepo: nodeUpdateRepo,
	}
}

func (s *NodeService) getUserID(ctx context.Context) (string, error) {
	uid, ok := authctx.UserID(ctx)
	if !ok {
		return "", ErrUnauthenticated
	}
	return uid, nil
}

// authorizeOwner combines two checks every state-mutating endpoint must
// perform: that the request is authenticated (uid present in context) and
// that the caller actually owns the resource described by the request
// payload. It returns the verified uid so call sites can use it without a
// second context lookup. Read-only endpoints that scope by uid alone keep
// using getUserID directly.
func (s *NodeService) authorizeOwner(ctx context.Context, claimedOwnerID string) (string, error) {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return "", err
	}
	if claimedOwnerID != uid {
		return "", ErrForbidden
	}
	return uid, nil
}

func (s *NodeService) SaveNode(ctx context.Context, n Node) error {
	// Authorise the inbound payload before triggering any side effects: a
	// malformed request that claims a foreign user id must never reach
	// repository writes, even if the caller would otherwise be filtered by
	// uid downstream.
	uid, err := s.authorizeOwner(ctx, n.UserID())
	if err != nil {
		return err
	}

	// Inspect the existing node (if any) once, then act on each transition:
	//   - STANDARD -> E2EE flips the encryption strategy and must purge
	//     plaintext children, which become unreadable by design.
	//   - parent_id changes via upsert must be cycle-safe. Without this,
	//     callers could bypass MoveNode and create cycles by issuing a
	//     plain SaveNode with a malicious parent_id.
	if old, err := s.GetNode(ctx, n.ID()); err == nil {
		if old.EncryptionStrategy() == EncryptionStandard && n.EncryptionStrategy() == EncryptionE2EE {
			if err := s.elementRepo.DeleteByNodeID(ctx, n.ID(), uid); err != nil {
				return err
			}
		}
		if old.ParentID() != n.ParentID() {
			if err := s.validateNewParent(ctx, n.ID(), n.ParentID(), uid); err != nil {
				return err
			}
		}
	}

	if IsStructureType(n.Type()) {
		return s.structureRepo.Save(ctx, n)
	}
	return s.elementRepo.Save(ctx, n)
}

// validateNewParent is the single source of truth for "is this parent
// change safe?" — both MoveNode and (eventually) SaveNode delegate here so
// the cycle/ownership contract cannot drift between entry points.
//
// It enforces three invariants:
//  1. A node cannot be its own parent.
//  2. A non-root destination must exist and be owned by the caller. Without
//     this, the ancestor walk would silently treat "parent not visible to
//     me" as "I have reached the top of the tree".
//  3. None of the destination's ancestors may equal nodeID (cycle), capped
//     at maxAncestorWalk to guard against corrupt parent chains.
func (s *NodeService) validateNewParent(ctx context.Context, nodeID, newParentID, uid string) error {
	if nodeID == newParentID {
		return ErrCircularRef
	}

	if !IsVirtualRoot(newParentID) {
		if _, err := s.structureRepo.FindByID(ctx, newParentID, uid); err != nil {
			return ErrForbidden
		}
	}

	curr := newParentID
	for steps := 0; curr != "" && steps < maxAncestorWalk; steps++ {
		if curr == nodeID {
			return ErrCircularRef
		}
		parent, err := s.structureRepo.FindByID(ctx, curr, uid)
		if err != nil {
			// Reached the virtual root or a parent we can't confirm — stop
			// walking. The pre-check above has already gated unsafe
			// destinations, so a break here is safe.
			break
		}
		curr = parent.ParentID()
	}
	return nil
}

func (s *NodeService) MoveNode(ctx context.Context, id, newParentId string) error {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return err
	}

	if err := s.validateNewParent(ctx, id, newParentId, uid); err != nil {
		return err
	}

	node, err := s.GetNode(ctx, id)
	if err != nil {
		return err
	}

	updated := NewFullNode(
		node.ID(),
		node.Type(),
		newParentId,
		uid,
		node.EngineType(),
		node.EncryptionStrategy(),
		node.MetadataPayload(),
		node.UpdatedAt(),
		node.IsDeleted(),
	)
	return s.SaveNode(ctx, updated)
}

func (s *NodeService) GetNode(ctx context.Context, id string) (Node, error) {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return nil, err
	}

	// Try structure first
	if n, err := s.structureRepo.FindByID(ctx, id, uid); err == nil {
		return n, nil
	}
	// Try element
	return s.elementRepo.FindByID(ctx, id, uid)
}

func (s *NodeService) DeleteNode(ctx context.Context, id string) error {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return err
	}

	nodes, err := s.structureRepo.GetTree(ctx, id, uid)
	if err != nil {
		// If not in structure, might be element
		return s.elementRepo.Delete(ctx, id, uid)
	}

	var structureIDs []string
	var elementIDs []string

	for _, n := range nodes {
		if IsStructureType(n.Type()) {
			structureIDs = append(structureIDs, n.ID())
		} else {
			elementIDs = append(elementIDs, n.ID())
		}
	}

	if len(structureIDs) > 0 {
		if err := s.structureRepo.DeleteMany(ctx, structureIDs, uid); err != nil {
			return err
		}
	}

	if len(elementIDs) > 0 {
		if err := s.elementRepo.DeleteMany(ctx, elementIDs, uid); err != nil {
			return err
		}
	}

	return nil
}

func (s *NodeService) SearchNodes(ctx context.Context, query string) ([]Node, error) {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return nil, err
	}
	return s.structureRepo.Search(ctx, query, uid)
}

func (s *NodeService) SaveUpdate(ctx context.Context, update *NodeUpdate) error {
	if _, err := s.authorizeOwner(ctx, update.UserID); err != nil {
		return err
	}
	return s.nodeUpdateRepo.Save(ctx, update)
}

func (s *NodeService) GetUpdates(ctx context.Context, nodeId string) ([]*NodeUpdate, error) {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return nil, err
	}
	return s.nodeUpdateRepo.FindAllByNodeID(ctx, nodeId, uid)
}
