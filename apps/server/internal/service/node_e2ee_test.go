package service

import (
	"context"
	"testing"
)

func TestNodeService_E2EE_Transition_Purge(t *testing.T) {
	uid := "u1"
	ctx := context.WithValue(context.Background(), UserIDKey, uid)

	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

	// 1. Setup a STANDARD node with plaintext elements
	nodeID := "node-123"
	node := NewFullNode(nodeID, "NOTEBOOK", "root", uid, "CANVAS", "STANDARD", []byte("meta"), 0, false)
	svc.SaveNode(ctx, node)

	element := NewBaseNode("el-1", "ELEMENT_STROKE", nodeID, uid)
	svc.SaveNode(ctx, element)

	// Verify element exists
	_, err := elementRepo.FindByID(ctx, "el-1", uid)
	if err != nil {
		t.Fatalf("expected element to exist, got %v", err)
	}

	// 2. Transition to E2EE
	e2eeNode := NewFullNode(nodeID, "NOTEBOOK", "root", uid, "CANVAS", "E2EE", []byte("meta"), 1, false)
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
