package service

import (
	"context"
	"testing"
)

func TestNodeService_NodeUpdates(t *testing.T) {
	uid := "u1"
	ctx := context.WithValue(context.Background(), UserIDKey, uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

	nodeID := "test-node-1"
	payload1 := []byte("encrypted-delta-1")
	payload2 := []byte("encrypted-delta-2")

	// 1. Save first update
	update1 := &NodeUpdate{

		NodeID:  nodeID,
		UserID:  uid,
		Payload: payload1,
	}
	if err := svc.SaveUpdate(ctx, update1); err != nil {
		t.Fatalf("failed to save update 1: %v", err)
	}

	// 2. Save second update
	update2 := &NodeUpdate{

		NodeID:  nodeID,
		UserID:  uid,
		Payload: payload2,
	}
	if err := svc.SaveUpdate(ctx, update2); err != nil {
		t.Fatalf("failed to save update 2: %v", err)
	}

	// 3. Get updates and verify
	updates, err := svc.GetUpdates(ctx, nodeID)
	if err != nil {
		t.Fatalf("failed to get updates: %v", err)
	}

	if len(updates) != 2 {
		t.Errorf("expected 2 updates, got %d", len(updates))
	}

	if string(updates[0].Payload) != string(payload1) {
		t.Errorf("expected payload %s, got %s", payload1, updates[0].Payload)
	}

	if string(updates[1].Payload) != string(payload2) {
		t.Errorf("expected payload %s, got %s", payload2, updates[1].Payload)
	}

	// 4. Verify isolation: u2 should see 0 updates
	ctx2 := context.WithValue(context.Background(), UserIDKey, "u2")
	updates2, _ := svc.GetUpdates(ctx2, nodeID)
	if len(updates2) != 0 {
		t.Errorf("expected 0 updates for u2, got %d", len(updates2))
	}
}
