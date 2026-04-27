package repository_test

import (
	"github.com/uptrace/bun"

	"context"
	"fmt"
	"github.com/tamara1031/spatial-notes/apps/server/internal/infrastructure"
	"github.com/tamara1031/spatial-notes/apps/server/internal/repository"
	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"testing"
)

func BenchmarkNodeRepository_DeleteIndividual(b *testing.B) {
	db, err := infrastructure.NewDB("sqlite", ":memory:")
	if err != nil {
		b.Fatal(err)
	}
	ctx := context.Background()
	infrastructure.CreateSchema(ctx, db)
	repo := repository.NewNodeRepository(db)

	uid := "u1"

	for i := 0; i < b.N; i++ {
		b.StopTimer()
		for j := 0; j < 1000; j++ {
			n := service.NewBaseNode(fmt.Sprintf("n%d_%d", i, j), "CHAPTER", "root", uid)
			repo.Save(ctx, n)
		}

		var ids []string
		for j := 0; j < 1000; j++ {
			ids = append(ids, fmt.Sprintf("n%d_%d", i, j))
		}
		b.StartTimer()

		for _, id := range ids {
			repo.Delete(ctx, id, uid)
		}
	}
}

// BenchmarkNodeRepository_GetTree_Wide measures GetTree on a wide, shallow
// tree (1 root + 200 direct children). This is the common real-world shape
// for a notebook with many top-level chapters.
func BenchmarkNodeRepository_GetTree_Wide(b *testing.B) {
	db, err := infrastructure.NewDB("sqlite", ":memory:")
	if err != nil {
		b.Fatal(err)
	}
	ctx := context.Background()
	infrastructure.CreateSchema(ctx, db)
	repo := repository.NewNodeRepository(db)

	uid := "u1"
	root := service.NewBaseNode("root", "CHAPTER", "", uid)
	repo.Save(ctx, root)
	for i := 0; i < 200; i++ {
		n := service.NewBaseNode(fmt.Sprintf("child%d", i), "CHAPTER", "root", uid)
		repo.Save(ctx, n)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := repo.GetTree(ctx, "root", uid); err != nil {
			b.Fatal(err)
		}
	}
}

// BenchmarkNodeRepository_GetTree_Deep measures GetTree on a linear chain
// of 20 nodes — this is the worst case for the old BFS (20 queries) and
// the best stress-test for CTE recursion.
func BenchmarkNodeRepository_GetTree_Deep(b *testing.B) {
	db, err := infrastructure.NewDB("sqlite", ":memory:")
	if err != nil {
		b.Fatal(err)
	}
	ctx := context.Background()
	infrastructure.CreateSchema(ctx, db)
	repo := repository.NewNodeRepository(db)

	uid := "u1"
	parentID := ""
	for i := 0; i < 20; i++ {
		id := fmt.Sprintf("d%d", i)
		n := service.NewBaseNode(id, "CHAPTER", parentID, uid)
		repo.Save(ctx, n)
		parentID = id
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := repo.GetTree(ctx, "d0", uid); err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkNodeRepository_DeleteMany(b *testing.B) {
	db, err := infrastructure.NewDB("sqlite", ":memory:")
	if err != nil {
		b.Fatal(err)
	}
	ctx := context.Background()
	infrastructure.CreateSchema(ctx, db)
	repo := repository.NewNodeRepository(db)

	uid := "u1"

	for i := 0; i < b.N; i++ {
		b.StopTimer()
		for j := 0; j < 1000; j++ {
			n := service.NewBaseNode(fmt.Sprintf("n%d_%d", i, j), "CHAPTER", "root", uid)
			repo.Save(ctx, n)
		}

		var ids []string
		for j := 0; j < 1000; j++ {
			ids = append(ids, fmt.Sprintf("n%d_%d", i, j))
		}
		b.StartTimer()

		// This tests an imagined method
		_, _ = db.NewUpdate().Table("notebook_nodes").
			Set("is_deleted = 1").
			Where("id IN (?) AND user_id = ?", bun.In(ids), uid).
			Exec(ctx)
	}
}
