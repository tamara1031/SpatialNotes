package repository_test

import (
	"context"
	"fmt"
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

// TestSqliteNodeRepository_GetTree_Deep pins that the recursive CTE returns
// every node across a 10-level chain — the old BFS implementation also
// handled this correctly, but only by issuing 10 round-trips. This test
// gives confidence that the single-query CTE produces identical results.
func TestSqliteNodeRepository_GetTree_Deep(t *testing.T) {
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
	uid := "u1"
	const depth = 10

	// Build a linear chain: n0 -> n1 -> n2 -> ... -> n9
	ids := make([]string, depth)
	for i := range ids {
		ids[i] = fmt.Sprintf("n%d", i)
	}
	parentID := ""
	for i, id := range ids {
		n := service.NewBaseNode(id, "CHAPTER", parentID, uid)
		if err := repo.Save(ctx, n); err != nil {
			t.Fatalf("save %s: %v", id, err)
		}
		parentID = id
		_ = i
	}

	tree, err := repo.GetTree(ctx, ids[0], uid)
	if err != nil {
		t.Fatalf("GetTree failed: %v", err)
	}
	if len(tree) != depth {
		t.Errorf("expected %d nodes in deep tree, got %d", depth, len(tree))
	}

	// Verify every id appears in the result (order not guaranteed by CTE).
	found := make(map[string]bool, depth)
	for _, n := range tree {
		found[n.ID()] = true
	}
	for _, id := range ids {
		if !found[id] {
			t.Errorf("node %q missing from GetTree result", id)
		}
	}
}

// TestSqliteNodeRepository_GetTree_ExcludesDeleted pins that soft-deleted
// nodes are not included in the CTE result, and that a deleted root returns
// ErrNodeNotFound rather than a partial subtree.
func TestSqliteNodeRepository_GetTree_ExcludesDeleted(t *testing.T) {
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
	uid := "u1"

	root := service.NewBaseNode("root", "CHAPTER", "", uid)
	live := service.NewBaseNode("live", "CHAPTER", "root", uid)
	gone := service.NewFullNode("gone", "CHAPTER", "root", uid, "", "STANDARD", nil, 0, true)

	for _, n := range []service.Node{root, live, gone} {
		if err := repo.Save(ctx, n); err != nil {
			t.Fatal(err)
		}
	}

	tree, err := repo.GetTree(ctx, "root", uid)
	if err != nil {
		t.Fatalf("GetTree: %v", err)
	}
	if len(tree) != 2 {
		t.Errorf("expected 2 nodes (root + live), got %d", len(tree))
	}
	for _, n := range tree {
		if n.ID() == "gone" {
			t.Errorf("soft-deleted node 'gone' appeared in GetTree result")
		}
	}

	// A deleted root must not appear in the anchor step of the CTE.
	deletedRoot := service.NewFullNode("dr", "CHAPTER", "", uid, "", "STANDARD", nil, 0, true)
	if err := repo.Save(ctx, deletedRoot); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.GetTree(ctx, "dr", uid); err == nil {
		t.Errorf("expected ErrNodeNotFound for deleted root, got nil")
	}
}

// TestSqliteNodeRepository_Search pins three contracts of the Search method:
// (1) empty query returns all non-deleted nodes for the owner,
// (2) non-empty query filters by type prefix (case-insensitive),
// (3) deleted nodes are excluded from results.
func TestSqliteNodeRepository_Search(t *testing.T) {
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
	uid := "u1"

	chapter := service.NewBaseNode("ch1", service.NodeTypeChapter, "", uid)
	notebook := service.NewBaseNode("nb1", service.NodeTypeNotebook, "ch1", uid)
	deleted := service.NewFullNode("del1", service.NodeTypeChapter, "", uid, "", service.EncryptionStandard, nil, 0, true)
	foreign := service.NewBaseNode("fgn1", service.NodeTypeChapter, "", "u2")

	for _, n := range []service.Node{chapter, notebook, deleted, foreign} {
		if err := repo.Save(ctx, n); err != nil {
			t.Fatalf("save %s: %v", n.ID(), err)
		}
	}

	t.Run("empty query returns all non-deleted nodes for owner", func(t *testing.T) {
		results, err := repo.Search(ctx, "", uid)
		if err != nil {
			t.Fatalf("Search: %v", err)
		}
		if len(results) != 2 {
			t.Errorf("expected 2 results (chapter + notebook), got %d", len(results))
		}
		for _, n := range results {
			if n.IsDeleted() {
				t.Errorf("Search returned deleted node %q", n.ID())
			}
			if n.UserID() != uid {
				t.Errorf("Search returned foreign node %q (user=%s)", n.ID(), n.UserID())
			}
		}
	})

	t.Run("type prefix filters results", func(t *testing.T) {
		results, err := repo.Search(ctx, "CHAPTER", uid)
		if err != nil {
			t.Fatalf("Search: %v", err)
		}
		if len(results) != 1 {
			t.Errorf("expected 1 CHAPTER result, got %d", len(results))
		}
		if len(results) > 0 && results[0].Type() != service.NodeTypeChapter {
			t.Errorf("expected type CHAPTER, got %q", results[0].Type())
		}
	})

	t.Run("no results for unmatched type query", func(t *testing.T) {
		results, err := repo.Search(ctx, "STROKE", uid)
		if err != nil {
			t.Fatalf("Search: %v", err)
		}
		if len(results) != 0 {
			t.Errorf("expected 0 results for STROKE query, got %d", len(results))
		}
	})
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
