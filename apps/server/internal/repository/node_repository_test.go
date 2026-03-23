package repository_test

import (
	"context"
	"testing"

	"github.com/tamara1031/spatial-notes/apps/server/internal/infrastructure"
	"github.com/tamara1031/spatial-notes/apps/server/internal/repository"
	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

func TestSqliteNodeRepository_Save(t *testing.T) {
	db, err := infrastructure.NewDB("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	ctx := context.Background()
	if err := infrastructure.CreateSchema(ctx, db); err != nil {
		t.Fatal(err)
	}

	repo := repository.NewNodeRepository(db)

	node := service.NewBaseNode("1", "CHAPTER", "", "u1")
	if err := repo.Save(ctx, node); err != nil {
		t.Errorf("failed to save node: %v", err)
	}

	saved, err := repo.FindByID(ctx, "1", "u1")
	if err != nil {
		t.Errorf("failed to find node: %v", err)
	}

	if saved.ID() != "1" || saved.Type() != "CHAPTER" || saved.UserID() != "u1" {
		t.Errorf("expected node 1 for u1, got %v", saved)
	}

	// Should not find node for different user
	_, err = repo.FindByID(ctx, "1", "u2")
	if err == nil {
		t.Errorf("found node 1 for u2, but it belongs to u1")
	}

	// Test is_deleted sync from top-level field
	nodeWithDeletedFlag := service.NewFullNode("2", "CHAPTER", "1", "u1", "CANVAS", "STANDARD", []byte("deleted metadata"), 12345, true)

	if err := repo.Save(ctx, nodeWithDeletedFlag); err != nil {
		t.Fatal(err)
	}

	savedDeleted, err := repo.FindByID(ctx, "2", "u1")
	if err != nil {
		t.Fatal(err)
	}
	if !savedDeleted.IsDeleted() {
		t.Errorf("expected node 2 to be deleted via top-level flag")
	}
}

func TestSqliteNodeRepository_GetTree(t *testing.T) {
	db, err := infrastructure.NewDB("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	ctx := context.Background()
	if err := infrastructure.CreateSchema(ctx, db); err != nil {
		t.Fatal(err)
	}

	repo := repository.NewNodeRepository(db)

	// Setup hierarchy for u1
	root1 := service.NewBaseNode("root1", "CHAPTER", "", "u1")
	child1 := service.NewBaseNode("c1", "NOTEBOOK", "root1", "u1")

	// Setup same hierarchy for u2 (isolation check)
	root2 := service.NewBaseNode("root2", "CHAPTER", "", "u2")

	for _, n := range []service.Node{root1, child1, root2} {
		if err := repo.Save(ctx, n); err != nil {
			t.Fatal(err)
		}
	}

	tree, err := repo.GetTree(ctx, "root1", "u1")
	if err != nil {
		t.Fatal(err)
	}

	if len(tree) != 2 {
		t.Errorf("expected 2 nodes in tree for u1, got %d", len(tree))
	}

	// Root2 should not be in u1's tree even if we somehow requested it (FindByID would fail)
	_, err = repo.GetTree(ctx, "root2", "u1")
	if err == nil {
		t.Errorf("should not find root2 for u1")
	}
}
