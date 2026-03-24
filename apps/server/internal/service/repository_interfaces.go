package service

import (
	"context"
)

// StructureRepository manages Notebooks and Chapters (Structural Hierarchy)
type StructureRepository interface {
	Save(ctx context.Context, node Node) error
	FindByID(ctx context.Context, id, userID string) (Node, error)
	GetTree(ctx context.Context, rootId, userID string) ([]Node, error)
	Delete(ctx context.Context, id, userID string) error
	DeleteMany(ctx context.Context, ids []string, userID string) error
	Search(ctx context.Context, query, userID string) ([]Node, error)
}

// ElementRepository manages Canvas Elements (Strokes, etc.)
// Note: In E2EE model, elements might be deprecated in favor of opaque updates,
// but we keep it for flexibility.
type ElementRepository interface {
	Save(ctx context.Context, node Node) error
	FindByID(ctx context.Context, id, userID string) (Node, error)
	Delete(ctx context.Context, id, userID string) error
	DeleteMany(ctx context.Context, ids []string, userID string) error
	DeleteByNodeID(ctx context.Context, nodeId, userID string) error
}

// NodeUpdateRepository manages E2EE deltas
type NodeUpdateRepository interface {
	Save(ctx context.Context, update *NodeUpdate) error
	FindAllByNodeID(ctx context.Context, nodeId, userID string) ([]*NodeUpdate, error)
}

// RoomUpdateRepository manages Yjs deltas
type RoomUpdateRepository interface {
	Save(ctx context.Context, roomId, userID string, payload []byte) error
	FindAllByRoomID(ctx context.Context, roomId, userID string) ([][]byte, error)
}
