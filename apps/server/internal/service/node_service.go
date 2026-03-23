package service

import (
	"context"
	"errors"
)

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

// UserIDKey is used to extract user ID from context.
// In a real app, this should be imported from application package or shared.
type contextKey string

const UserIDKey contextKey = "user_id"

func (s *NodeService) getUserID(ctx context.Context) (string, error) {
	uid, ok := ctx.Value(UserIDKey).(string)
	if !ok || uid == "" {
		return "", errors.New("unauthorized: user id not found in context")
	}
	return uid, nil
}

func (s *NodeService) SaveNode(ctx context.Context, n Node) error {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return err
	}

	// Case 1: Existing node switching to E2EE
	if old, err := s.GetNode(ctx, n.ID()); err == nil {
		if old.EncryptionStrategy() == "STANDARD" && n.EncryptionStrategy() == "E2EE" {
			// Trigger Purge of plaintext elements/indices
			if err := s.elementRepo.DeleteByNodeID(ctx, n.ID(), uid); err != nil {
				return err
			}
		}
	}

	if n.UserID() != uid {
		return errors.New("forbidden: user does not own this node")
	}

	switch n.Type() {
	case "CHAPTER", "NOTEBOOK":
		return s.structureRepo.Save(ctx, n)
	default:
		return s.elementRepo.Save(ctx, n)
	}
}

func (s *NodeService) MoveNode(ctx context.Context, id, newParentId string) error {
	uid, err := s.getUserID(ctx)
	if err != nil {
		return err
	}

	if id == newParentId {
		return errors.New("circular reference: cannot move node to itself")
	}

	curr := newParentId
	for curr != "" {
		if curr == id {
			return errors.New("circular reference: cannot move node into its own descendant")
		}
		parent, err := s.structureRepo.FindByID(ctx, curr, uid)
		if err != nil {
			break
		}
		curr = parent.ParentID()
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

	for _, n := range nodes {
		switch n.Type() {
		case "CHAPTER", "NOTEBOOK":
			if err := s.structureRepo.Delete(ctx, n.ID(), uid); err != nil {
				return err
			}
		default:
			if err := s.elementRepo.Delete(ctx, n.ID(), uid); err != nil {
				return err
			}
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

	uid, err := s.getUserID(ctx)
	if err != nil {
		return err
	}
	if update.UserID != uid {
		return errors.New("forbidden: user id mismatch")
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
