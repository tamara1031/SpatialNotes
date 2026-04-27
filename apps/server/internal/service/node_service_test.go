package service

import (
	"context"
	"errors"
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
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

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
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

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
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

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
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

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
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

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
