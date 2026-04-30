package service

import (
	"context"
	"errors"
	"testing"

	"github.com/tamara1031/spatial-notes/apps/server/pkg/authctx"
)

func TestNodeService_E2EE_Transition_Purge(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)

	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, NewFakeTransactorWithRepos(structureRepo, elementRepo))

	// 1. Setup a STANDARD node with plaintext elements
	nodeID := "node-123"
	node := NewFullNode(nodeID, NodeTypeNotebook, "root", uid, "CANVAS", EncryptionStandard, []byte("meta"), 0, false)
	svc.SaveNode(ctx, node)

	element := NewBaseNode("el-1", NodeTypeElementStroke, nodeID, uid)
	svc.SaveNode(ctx, element)

	// Verify element exists
	_, err := elementRepo.FindByID(ctx, "el-1", uid)
	if err != nil {
		t.Fatalf("expected element to exist, got %v", err)
	}

	// 2. Transition to E2EE
	e2eeNode := NewFullNode(nodeID, NodeTypeNotebook, "root", uid, "CANVAS", EncryptionE2EE, []byte("meta"), 1, false)
	err = svc.SaveNode(ctx, e2eeNode)
	if err != nil {
		t.Fatalf("failed to transition to E2EE: %v", err)
	}

	// 3. Verify element is PURGED
	_, err = elementRepo.FindByID(ctx, "el-1", uid)
	if err == nil {
		t.Errorf("expected element to be purged after E2EE transition")
	}
}

// TestNodeService_E2EE_Transition_Atomicity pins that a failure while saving
// the updated node after DeleteByNodeID does not leave the repos in a split
// state — elements purged but the node still carrying STANDARD strategy.
// Before the Transactor was introduced, a Save failure would leave element
// children permanently gone while the parent node claimed to be STANDARD.
func TestNodeService_E2EE_Transition_Atomicity(t *testing.T) {
	uid := "u1"
	ctx := authctx.With(context.Background(), uid)

	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()

	// failAfter=2: call 1 (DeleteByNodeID) succeeds; call 2 (Save) returns
	// ErrInternal, simulating an infrastructure failure mid-transaction.
	transactor := &FakeTransactor{failAfter: 2}
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo, transactor)

	nodeID := "nb-1"
	node := NewFullNode(nodeID, NodeTypeNotebook, "root", uid, "CANVAS", EncryptionStandard, []byte("meta"), 0, false)
	if err := svc.SaveNode(ctx, node); err != nil {
		t.Fatalf("setup: save STANDARD node: %v", err)
	}
	el := NewBaseNode("el-1", NodeTypeElementStroke, nodeID, uid)
	if err := elementRepo.Save(ctx, el); err != nil {
		t.Fatalf("setup: save element: %v", err)
	}

	// Transition to E2EE — the tx writer fails on the Save call.
	e2eeNode := NewFullNode(nodeID, NodeTypeNotebook, "root", uid, "CANVAS", EncryptionE2EE, []byte("meta"), 1, false)
	err := svc.SaveNode(ctx, e2eeNode)
	if !errors.Is(err, ErrInternal) {
		t.Fatalf("expected ErrInternal from mid-tx failure, got %v", err)
	}

	// The element repo must be untouched — the FakeTransactor's failing writer
	// never called the real repos, modelling a rolled-back transaction.
	if _, err := elementRepo.FindByID(ctx, "el-1", uid); err != nil {
		t.Errorf("el-1 should still exist after aborted E2EE transition: %v", err)
	}
}
