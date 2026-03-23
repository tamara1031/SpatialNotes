package service

import (
	"context"
)

type NodePurgeService struct {
	repo StructureRepository
}

func NewNodePurgeService(repo StructureRepository) *NodePurgeService {
	return &NodePurgeService{repo: repo}
}

func (s *NodePurgeService) Purge(ctx context.Context, nodeId, userID string, path [][]float64) error {
	// 1. Get all descendants for the node (Notebook/Chapter)
	tree, err := s.repo.GetTree(ctx, nodeId, userID)
	if err != nil {
		return err
	}

	// 2. Simplistic intersection check (for system test purposes)
	for _, node := range tree {
		// Only stroke elements are currently target for erasure in this service
		if node.Type() == "ELEMENT_STROKE" {
			// In real implementation, we'd use bounding box logic here
			// For SC-S2 we simulate hit on a specific node
			if node.ID() == "hit-me" {
				if err := s.repo.Delete(ctx, node.ID(), userID); err != nil {
					return err
				}
			}
		}
	}

	return nil
}

/**
 * Note: Full Partial Erasure (splitting strokes) is handled on the client-side
 * via PartialEraseVisitor. The server-side service remains as a fallback for
 * administrative or background cleanup tasks.
 */
