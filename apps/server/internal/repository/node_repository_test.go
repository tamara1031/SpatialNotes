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

func TestSqliteNodeRepository_Delete(t *testing.T) {
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

	// Setup nodes
	n1 := service.NewBaseNode("n1", "NOTEBOOK", "", "u1")
	n2 := service.NewBaseNode("n2", "NOTEBOOK", "", "u2")

	if err := repo.Save(ctx, n1); err != nil {
		t.Fatal(err)
	}
	if err := repo.Save(ctx, n2); err != nil {
		t.Fatal(err)
	}

	// 1. Happy Path: Delete n1 for u1
	if err := repo.Delete(ctx, "n1", "u1"); err != nil {
		t.Errorf("failed to delete node: %v", err)
	}

	saved1, err := repo.FindByID(ctx, "n1", "u1")
	if err != nil {
		t.Fatalf("failed to find n1 after delete: %v", err)
	}
	if !saved1.IsDeleted() {
		t.Errorf("expected n1 to be deleted")
	}

	// 2. Edge Case: Wrong User - Delete n2 for u1
	if err := repo.Delete(ctx, "n2", "u1"); err != nil {
		t.Errorf("expected no error when deleting with wrong user (no rows affected), got: %v", err)
	}

	saved2, err := repo.FindByID(ctx, "n2", "u2")
	if err != nil {
		t.Fatalf("failed to find n2: %v", err)
	}
	if saved2.IsDeleted() {
		t.Errorf("expected n2 to NOT be deleted because wrong user requested it")
	}

	// 3. Edge Case: Non-existent Node
	if err := repo.Delete(ctx, "non_existent", "u1"); err != nil {
		t.Errorf("expected no error when deleting non-existent node (no rows affected), got: %v", err)
	}
}
