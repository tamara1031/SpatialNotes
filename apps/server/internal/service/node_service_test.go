package service

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/tamara1031/spatial-notes/apps/server/pkg/authctx"
)

func TestNodeService_CircularReference(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	// Hierarchy: root -> n1 -> n2 -> n3
	n1 := NewBaseNode("n1", NodeTypeChapter, "root", uid)
	n2 := NewBaseNode("n2", NodeTypeChapter, "n1", uid)
	n3 := NewBaseNode("n3", NodeTypeChapter, "n2", uid)

	structureRepo.Save(ctx, n1)
	structureRepo.Save(ctx, n2)
	structureRepo.Save(ctx, n3)

	// 1. Move to itself
	if err := svc.MoveNode(ctx, "n1", "n1"); !errors.Is(err, ErrCircularRef) {
		t.Errorf("expected ErrCircularRef (itself), got %v", err)
	}

	// 2. Move to descendant (n1 to n3)
	if err := svc.MoveNode(ctx, "n1", "n3"); !errors.Is(err, ErrCircularRef) {
		t.Errorf("expected ErrCircularRef (descendant), got %v", err)
	}

	// 3. Valid move (n3 to root)
	if err := svc.MoveNode(ctx, "n3", "root"); err != nil {
		t.Errorf("expected valid move, got %v", err)
	}
}

func TestNodeService_SaveNode_RejectsForeignOwnerBeforeSideEffects(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	// Existing STANDARD node owned by u1 with one plaintext element child.
	nodeID := "nb1"
	nb := NewFullNode(nodeID, NodeTypeNotebook, "root", uid, "CANVAS", EncryptionStandard, nil, 0, false)
	if err := svc.SaveNode(ctx, nb); err != nil {
		t.Fatalf("setup: save nb: %v", err)
	}
	el := NewBaseNode("el-1", NodeTypeElementStroke, nodeID, uid)
	if err := svc.SaveNode(ctx, el); err != nil {
		t.Fatalf("setup: save element: %v", err)
	}

	// A request that tries to flip the same node to E2EE while claiming a
	// different owner must be rejected, and must not destroy any plaintext
	// elements as a side effect of the rejected request.
	hostile := NewFullNode(nodeID, NodeTypeNotebook, "root", "attacker", "CANVAS", EncryptionE2EE, nil, 1, false)
	if err := svc.SaveNode(ctx, hostile); !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden for foreign user save, got %v", err)
	}

	// Element must still exist - the auth check must short-circuit before
	// the E2EE purge runs.
	if _, err := elementRepo.FindByID(ctx, "el-1", uid); err != nil {
		t.Errorf("element was wrongly purged by a rejected save: %v", err)
	}
}

func TestNodeService_MoveNode_RejectsForeignNewParent(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	// u1 owns node "mine". u2 owns node "victim".
	mine := NewBaseNode("mine", NodeTypeChapter, "root", uid)
	victim := NewBaseNode("victim", NodeTypeChapter, "root", "u2")
	structureRepo.Save(ctx, mine)
	structureRepo.Save(ctx, victim)

	// Attempting to re-parent our own node onto a foreign user's node must
	// be rejected. Without ownership validation on newParentId, the
	// ancestor walk would silently treat "parent not visible to me" as
	// "I have reached the top of the tree" and let the move succeed.
	if err := svc.MoveNode(ctx, "mine", "victim"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden when moving onto a foreign parent, got %v", err)
	}

	// The node must not have been mutated as a side effect of the rejected
	// request: parent_id should still point at the virtual root.
	if got, _ := structureRepo.FindByID(ctx, "mine", uid); got.ParentID() != "root" {
		t.Errorf("rejected move should not have changed parent_id, got %q", got.ParentID())
	}

	// Likewise, a non-existent parent id must be rejected so callers cannot
	// orphan their own subtree onto an unreachable anchor.
	if err := svc.MoveNode(ctx, "mine", "does-not-exist"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden when moving onto an unknown parent, got %v", err)
	}
}

func TestNodeService_MoveNode_DepthGuardOnCorruptParentChain(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	// Construct a corrupted parent cycle: a <-> b. This should never occur
	// in well-formed data but must not be able to hang the server.
	a := NewFullNode("a", NodeTypeChapter, "b", uid, "", EncryptionStandard, nil, 0, false)
	b := NewFullNode("b", NodeTypeChapter, "a", uid, "", EncryptionStandard, nil, 0, false)
	target := NewBaseNode("target", NodeTypeChapter, "root", uid)
	structureRepo.Save(ctx, a)
	structureRepo.Save(ctx, b)
	structureRepo.Save(ctx, target)

	done := make(chan error, 1)
	go func() { done <- svc.MoveNode(ctx, "target", "a") }()

	select {
	case <-done:
		// Either succeeds or returns an error - what matters is that the
		// ancestor walk terminates.
	case <-time.After(2 * time.Second):
		t.Fatal("MoveNode did not terminate on corrupted parent cycle")
	}
}

func TestNodeService_RecursiveDelete(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	// Link them for GetTree to work in the fake
	structureRepo.SetExternalRepos(elementRepo)

	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	// Hierarchy: root -> n1 -> e1
	n1 := NewBaseNode("n1", NodeTypeChapter, "root", uid)
	e1 := NewBaseNode("e1", NodeTypeElementStroke, "n1", uid)

	structureRepo.Save(ctx, n1)
	elementRepo.Save(ctx, e1)

	// Delete n1
	if err := svc.DeleteNode(ctx, "n1"); err != nil {
		t.Fatal(err)
	}

	// Verify all are marked deleted in fake repos
	_, err := structureRepo.FindByID(ctx, "n1", uid)
	if err == nil {
		t.Errorf("expected n1 to be deleted")
	}
	_, err = elementRepo.FindByID(ctx, "e1", uid)
	if err == nil {
		t.Errorf("expected e1 to be deleted")
	}
}

// TestNodeService_SaveNode_RejectsCycleViaUpsert pins that SaveNode
// applies the same cycle-detection contract as MoveNode. Without this
// guard, a client could bypass MoveNode entirely by issuing a plain
// upsert that flips parent_id to point at a descendant of the node.
func TestNodeService_SaveNode_RejectsCycleViaUpsert(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	// Hierarchy: root -> n1 -> n2 -> n3
	n1 := NewBaseNode("n1", NodeTypeChapter, "root", uid)
	n2 := NewBaseNode("n2", NodeTypeChapter, "n1", uid)
	n3 := NewBaseNode("n3", NodeTypeChapter, "n2", uid)
	if err := svc.SaveNode(ctx, n1); err != nil {
		t.Fatalf("setup save n1: %v", err)
	}
	if err := svc.SaveNode(ctx, n2); err != nil {
		t.Fatalf("setup save n2: %v", err)
	}
	if err := svc.SaveNode(ctx, n3); err != nil {
		t.Fatalf("setup save n3: %v", err)
	}

	// Now attempt to upsert n1 with parent_id = "n3" (its own descendant).
	// Without the SaveNode guard this would corrupt the tree into a cycle
	// and the next read of the structure would loop until maxAncestorWalk.
	hostile := NewFullNode("n1", NodeTypeChapter, "n3", uid, "", EncryptionStandard, nil, 1, false)
	if err := svc.SaveNode(ctx, hostile); !errors.Is(err, ErrCircularRef) {
		t.Fatalf("expected ErrCircularRef when upserting parent_id pointing to descendant, got %v", err)
	}

	// And the on-disk parent_id must still be the original "root", proving
	// the rejection happened before the repository write.
	if got, _ := structureRepo.FindByID(ctx, "n1", uid); got.ParentID() != "root" {
		t.Errorf("rejected upsert should not have changed parent_id, got %q", got.ParentID())
	}
}

// TestNodeService_SaveNode_RejectsForeignParentViaUpsert pins that
// SaveNode rejects an upsert that re-parents the caller's node onto a
// node owned by a different user. This is the same protection MoveNode
// has, applied to the upsert entry point.
func TestNodeService_SaveNode_RejectsForeignParentViaUpsert(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	// u1 owns "mine" at root. u2 owns "victim" at root.
	mine := NewBaseNode("mine", NodeTypeChapter, "root", uid)
	victim := NewBaseNode("victim", NodeTypeChapter, "root", "u2")
	if err := svc.SaveNode(ctx, mine); err != nil {
		t.Fatalf("setup save mine: %v", err)
	}
	// Save victim directly via the repo because SaveNode's authorizeOwner
	// would reject a u1 caller persisting a node claimed by u2.
	if err := structureRepo.Save(ctx, victim); err != nil {
		t.Fatalf("setup save victim: %v", err)
	}

	hostile := NewFullNode("mine", NodeTypeChapter, "victim", uid, "", EncryptionStandard, nil, 1, false)
	if err := svc.SaveNode(ctx, hostile); !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected ErrForbidden when upserting onto foreign parent, got %v", err)
	}
}

// TestNodeService_SaveNode_AllowsUnchangedParent guards against a
// regression where the new parent-mutation guard runs on every save —
// re-saving an existing node with the same parent_id (e.g. an
// E2EE-strategy flip) must remain free of the validation overhead.
func TestNodeService_SaveNode_AllowsUnchangedParent(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	original := NewFullNode("nb1", NodeTypeNotebook, "root", uid, "CANVAS", EncryptionStandard, []byte("meta-v1"), 0, false)
	if err := svc.SaveNode(ctx, original); err != nil {
		t.Fatalf("setup save: %v", err)
	}

	// Re-save with same parent_id but updated metadata + bumped updatedAt.
	updated := NewFullNode("nb1", NodeTypeNotebook, "root", uid, "CANVAS", EncryptionStandard, []byte("meta-v2"), 1, false)
	if err := svc.SaveNode(ctx, updated); err != nil {
		t.Fatalf("expected unchanged-parent re-save to succeed, got %v", err)
	}
}

// TestNodeService_SearchNodes pins the three behavioural contracts of
// SearchNodes at the service layer, now that FakeStructureRepository.Search
// is implemented:
//
//  1. An unauthenticated context returns ErrUnauthenticated.
//  2. An empty query returns all non-deleted nodes for the caller.
//  3. A type-prefix query returns only matching nodes.
func TestNodeService_SearchNodes(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)

	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactor())

	ch1 := NewBaseNode("ch1", NodeTypeChapter, "", uid)
	nb1 := NewBaseNode("nb1", NodeTypeNotebook, "ch1", uid)
	ch2 := NewBaseNode("ch2", NodeTypeChapter, "", uid)
	// Save directly via repo to bypass service auth checks for foreign node.
	foreignNode := NewBaseNode("fgn1", NodeTypeChapter, "", "u2")

	for _, n := range []Node{ch1, nb1, ch2} {
		if err := svc.SaveNode(ctx, n); err != nil {
			t.Fatalf("setup save %s: %v", n.ID(), err)
		}
	}
	if err := structureRepo.Save(ctx, foreignNode); err != nil {
		t.Fatalf("setup save foreign: %v", err)
	}

	t.Run("unauthenticated returns ErrUnauthenticated", func(t *testing.T) {
		_, err := svc.SearchNodes(context.Background(), "")
		if !errors.Is(err, ErrUnauthenticated) {
			t.Errorf("expected ErrUnauthenticated, got %v", err)
		}
	})

	t.Run("empty query returns all caller nodes", func(t *testing.T) {
		nodes, err := svc.SearchNodes(ctx, "")
		if err != nil {
			t.Fatalf("SearchNodes: %v", err)
		}
		// ch1, nb1, ch2 — foreign node must be excluded.
		if len(nodes) != 3 {
			t.Errorf("expected 3 nodes, got %d", len(nodes))
		}
		for _, n := range nodes {
			if n.UserID() != uid {
				t.Errorf("SearchNodes returned node belonging to %q", n.UserID())
			}
		}
	})

	t.Run("type query filters to matching nodes only", func(t *testing.T) {
		nodes, err := svc.SearchNodes(ctx, "CHAPTER")
		if err != nil {
			t.Fatalf("SearchNodes: %v", err)
		}
		if len(nodes) != 2 {
			t.Errorf("expected 2 CHAPTER nodes, got %d", len(nodes))
		}
		for _, n := range nodes {
			if n.Type() != NodeTypeChapter {
				t.Errorf("expected type CHAPTER, got %q", n.Type())
			}
		}
	})

	t.Run("unmatched type query returns empty slice", func(t *testing.T) {
		nodes, err := svc.SearchNodes(ctx, "STROKE")
		if err != nil {
			t.Fatalf("SearchNodes: %v", err)
		}
		if len(nodes) != 0 {
			t.Errorf("expected 0 nodes for STROKE query, got %d", len(nodes))
		}
	})

	t.Run("unrecognised query string returns empty slice", func(t *testing.T) {
		nodes, err := svc.SearchNodes(ctx, "DOES_NOT_EXIST")
		if err != nil {
			t.Fatalf("SearchNodes: %v", err)
		}
		if len(nodes) != 0 {
			t.Errorf("expected 0 results, got %d", len(nodes))
		}
	})

	t.Run("repository ErrInternal propagates to caller", func(t *testing.T) {
		// Simulate an infrastructure failure (e.g. DB I/O error) that the
		// real NodeRepository.Search wraps with ErrInternal.
		structureRepo.searchErr = fmt.Errorf("node search: %w", ErrInternal)
		defer func() { structureRepo.searchErr = nil }()

		_, err := svc.SearchNodes(ctx, "")
		if !errors.Is(err, ErrInternal) {
			t.Errorf("expected ErrInternal to propagate, got %v", err)
		}
	})
}

// TestNodeService_SaveNode_Validation pins the domain invariants that
// SaveNode must enforce before touching auth or the repository. Each
// sub-test represents one broken invariant so regressions are pinpointed
// immediately.
func TestNodeService_SaveNode_Validation(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	svc := NewNodeService(
		NewFakeStructureRepository(),
		NewFakeElementRepository(),
		NewFakeNodeUpdateRepository(),
		NewFakeTransactor(),
	)

	cases := []struct {
		name string
		node Node
	}{
		{
			"empty ID",
			NewFullNode("", NodeTypeChapter, "root", uid, "", EncryptionStandard, nil, 0, false),
		},
		{
			"unknown node type",
			NewFullNode("n1", "CANVAS_ELEMENT", "root", uid, "", EncryptionStandard, nil, 0, false),
		},
		{
			"empty node type",
			NewFullNode("n1", "", "root", uid, "", EncryptionStandard, nil, 0, false),
		},
		{
			"unknown encryption strategy",
			NewFullNode("n1", NodeTypeChapter, "root", uid, "", "PLAIN_TEXT", nil, 0, false),
		},
		{
			"empty encryption strategy",
			NewFullNode("n1", NodeTypeChapter, "root", uid, "", "", nil, 0, false),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := svc.SaveNode(ctx, tc.node)
			if !errors.Is(err, ErrValidation) {
				t.Errorf("expected ErrValidation, got %v", err)
			}
		})
	}
}

// TestNodeService_SaveNode_Validation_ValidInputsPass confirms that all
// combinations of known types and strategies are accepted, guarding against
// an overly strict validateNode that rejects legitimate domain values.
func TestNodeService_SaveNode_Validation_ValidInputsPass(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)
	svc := NewNodeService(
		NewFakeStructureRepository(),
		NewFakeElementRepository(),
		NewFakeNodeUpdateRepository(),
		NewFakeTransactor(),
	)

	valid := []Node{
		NewFullNode("ch1", NodeTypeChapter, "root", uid, "", EncryptionStandard, nil, 0, false),
		NewFullNode("nb1", NodeTypeNotebook, "root", uid, "", EncryptionStandard, nil, 0, false),
		NewFullNode("el1", NodeTypeElementStroke, "nb1", uid, "", EncryptionStandard, nil, 0, false),
		NewFullNode("ch2", NodeTypeChapter, "root", uid, "", EncryptionE2EE, nil, 0, false),
	}

	for _, n := range valid {
		if err := svc.SaveNode(ctx, n); err != nil {
			t.Errorf("SaveNode(%q, %q): unexpected error %v", n.Type(), n.EncryptionStrategy(), err)
		}
	}
}

// TestNodeService_GetNode_PropagatesErrInternal pins that GetNode does not
// silently fall through to the element repository when the structure
// repository returns an infrastructure error. Before the fix, any error
// from structureRepo.FindByID was treated as "not found" and the element
// repo was consulted — masking DB failures as ErrNodeNotFound (404).
func TestNodeService_GetNode_PropagatesErrInternal(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)

	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	svc := NewNodeService(structureRepo, elementRepo, NewFakeNodeUpdateRepository(), NewFakeTransactor())

	// Seed an element so that, if the service incorrectly falls through,
	// it would find something and return nil error — exposing the regression.
	el := NewBaseNode("el-1", NodeTypeElementStroke, "nb1", uid)
	elementRepo.elements["el-1"] = el

	// Simulate an infrastructure failure in the structure repo.
	structureRepo.findErr = fmt.Errorf("db timeout: %w", ErrInternal)

	_, err := svc.GetNode(ctx, "el-1")
	if !errors.Is(err, ErrInternal) {
		t.Errorf("expected ErrInternal to propagate from structureRepo, got %v", err)
	}
}

// TestNodeService_DeleteNode_PropagatesErrInternal pins that DeleteNode does
// not silently fall through to elementRepo.Delete when structureRepo.GetTree
// returns an infrastructure error. Before the fix, any GetTree error was
// treated as "node is an element" and element deletion was attempted instead.
func TestNodeService_DeleteNode_PropagatesErrInternal(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)

	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	svc := NewNodeService(structureRepo, elementRepo, NewFakeNodeUpdateRepository(), NewFakeTransactor())

	// Simulate an infrastructure failure from GetTree.
	structureRepo.treeErr = fmt.Errorf("db closed: %w", ErrInternal)

	err := svc.DeleteNode(ctx, "any-id")
	if !errors.Is(err, ErrInternal) {
		t.Errorf("expected ErrInternal to propagate from structureRepo.GetTree, got %v", err)
	}
}
