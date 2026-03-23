package service

import (
	"context"
	"testing"
)

func TestNodePurgeService_AtomicErasure(t *testing.T) {
	ctx := context.Background()
	nodeRepo := NewFakeStructureRepository()
	svc := NewNodePurgeService(nodeRepo)

	uid := "u1"

	// Setup: Notebook with 2 elements
	nb := NewBaseNode("nb1", "NOTEBOOK", "root", uid)
	hit := NewBaseNode("hit-me", "ELEMENT_STROKE", "nb1", uid)
	miss := NewBaseNode("miss-me", "ELEMENT_STROKE", "nb1", uid)

	nodeRepo.Save(ctx, nb)
	nodeRepo.Save(ctx, hit)
	nodeRepo.Save(ctx, miss)

	// Act: Purge path
	path := [][]float64{{0, 0}}
	if err := svc.Purge(ctx, "nb1", uid, path); err != nil {
		t.Fatal(err)
	}

	// Verify: hit-me is deleted (missing from tree), miss-me remains
	tree, _ := nodeRepo.GetTree(ctx, "nb1", uid)
	hasHit := false
	hasMiss := false
	for _, n := range tree {
		if n.ID() == "hit-me" {
			hasHit = true
		}
		if n.ID() == "miss-me" {
			hasMiss = true
		}
	}

	if hasHit {
		t.Errorf("expected hit-me to be deleted from tree")
	}
	if !hasMiss {
		t.Errorf("expected miss-me to remain in tree")
	}
}
