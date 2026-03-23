package repository

import (
	"context"
	"time"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/uptrace/bun"
)

type NodeUpdateRepository struct {
	db *bun.DB
}

func NewNodeUpdateRepository(db *bun.DB) *NodeUpdateRepository {
	return &NodeUpdateRepository{db: db}
}

type NodeUpdateModel struct {
	bun.BaseModel `bun:"table:node_updates"`
	ID            int64  `bun:"id,autoincrement,pk"`
	NodeID        string `bun:"node_id"`
	UserID        string `bun:"user_id,notnull"`
	Payload       []byte `bun:"payload"`
	CreatedAt     int64  `bun:"created_at,notnull"`
}

func (r *NodeUpdateRepository) Save(ctx context.Context, update *service.NodeUpdate) error {

	model := &NodeUpdateModel{
		NodeID:    update.NodeID,
		UserID:    update.UserID,
		Payload:   update.Payload,
		CreatedAt: time.Now().Unix(),
	}
	_, err := r.db.NewInsert().Model(model).Exec(ctx)
	return err
}

func (r *NodeUpdateRepository) FindAllByNodeID(ctx context.Context, nodeId, userID string) ([]*service.NodeUpdate, error) {

	var models []NodeUpdateModel
	err := r.db.NewSelect().Model(&models).
		Where("node_id = ? AND user_id = ?", nodeId, userID).
		Order("id ASC").Scan(ctx)
	if err != nil {
		return nil, err
	}

	results := make([]*service.NodeUpdate, len(models))
	for i, m := range models {
		results[i] = &service.NodeUpdate{
			NodeID:    m.NodeID,
			UserID:    m.UserID,
			Payload:   m.Payload,
			CreatedAt: m.CreatedAt,
		}
	}
	return results, nil
}

var _ service.NodeUpdateRepository = (*NodeUpdateRepository)(nil)
