package repository_test

import (
	"github.com/uptrace/bun"

	"context"
	"fmt"
	"testing"
	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/tamara1031/spatial-notes/apps/server/internal/infrastructure"
	"github.com/tamara1031/spatial-notes/apps/server/internal/repository"
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
