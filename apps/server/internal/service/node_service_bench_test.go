package service_test

import (
	"context"
	"fmt"
	"testing"
	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

func BenchmarkNodeService_DeleteNode(b *testing.B) {
	uid := "u1"
	ctx := context.WithValue(context.Background(), service.UserIDKey, uid)

	for i := 0; i < b.N; i++ {
		b.StopTimer()
		structureRepo := service.NewFakeStructureRepository()
		elementRepo := service.NewFakeElementRepository()
		structureRepo.SetExternalRepos(elementRepo)
		nodeUpdateRepo := service.NewFakeNodeUpdateRepository()
		svc := service.NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

		// Create root
		root := service.NewBaseNode("root", "CHAPTER", "", uid)
		structureRepo.Save(ctx, root)

		// Create 1000 children
		for j := 0; j < 1000; j++ {
			n := service.NewBaseNode(fmt.Sprintf("n%d", j), "CHAPTER", "root", uid)
			structureRepo.Save(ctx, n)

			e := service.NewBaseNode(fmt.Sprintf("e%d", j), "ELEMENT_STROKE", n.ID(), uid)
			elementRepo.Save(ctx, e)
		}
		b.StartTimer()

		_ = svc.DeleteNode(ctx, "root")
	}
}
