package service

import (
	"context"
	"strings"
	"testing"
)

func TestNodeService_CircularReference(t *testing.T) {
	uid := "u1"
	ctx := context.WithValue(context.Background(), UserIDKey, uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

	// Hierarchy: root -> n1 -> n2 -> n3
	n1 := NewBaseNode("n1", "CHAPTER", "root", uid)
	n2 := NewBaseNode("n2", "CHAPTER", "n1", uid)
	n3 := NewBaseNode("n3", "CHAPTER", "n2", uid)

	structureRepo.Save(ctx, n1)
	structureRepo.Save(ctx, n2)
	structureRepo.Save(ctx, n3)

	// 1. Move to itself
	if err := svc.MoveNode(ctx, "n1", "n1"); err == nil || !strings.Contains(err.Error(), "circular reference") {
		t.Errorf("expected circular reference error (itself), got %v", err)
	}

	// 2. Move to descendant (n1 to n3)
	if err := svc.MoveNode(ctx, "n1", "n3"); err == nil || !strings.Contains(err.Error(), "circular reference") {
		t.Errorf("expected circular reference error (descendant), got %v", err)
	}

	// 3. Valid move (n3 to root)
	if err := svc.MoveNode(ctx, "n3", "root"); err != nil {
		t.Errorf("expected valid move, got %v", err)
	}
}

func TestNodeService_RecursiveDelete(t *testing.T) {
	uid := "u1"
	ctx := context.WithValue(context.Background(), UserIDKey, uid)
	structureRepo := NewFakeStructureRepository()
	elementRepo := NewFakeElementRepository()
	// Link them for GetTree to work in the fake
	structureRepo.SetExternalRepos(elementRepo)

	nodeUpdateRepo := NewFakeNodeUpdateRepository()
	svc := NewNodeService(structureRepo, elementRepo, nodeUpdateRepo)

	// Hierarchy: root -> n1 -> e1
	n1 := NewBaseNode("n1", "CHAPTER", "root", uid)
	e1 := NewBaseNode("e1", "ELEMENT_STROKE", "n1", uid)

	structureRepo.Save(ctx, n1)
	elementRepo.Save(ctx, e1)

	// Delete n1
	if err := svc.DeleteNode(ctx, "n1"); err != nil {
		t.Fatal(err)
	}

	// Verify all are marked deleted in fake repos
	_, err := structureRepo.FindByID(ctx, "n1", uid)
	if err == nil {
		t.Errorf("expected n1 to be deleted")
	}
	_, err = elementRepo.FindByID(ctx, "e1", uid)
	if err == nil {
		t.Errorf("expected e1 to be deleted")
	}
}
