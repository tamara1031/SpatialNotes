package repository

import (
	"context"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/uptrace/bun"
)

type NodeRepository struct {
	db *bun.DB
}

func NewNodeRepository(db *bun.DB) *NodeRepository {
	return &NodeRepository{db: db}
}

// Persistence Models (ADR-001/ADR-031/ADR-039/ADR-044)
type NotebookNode struct {
	bun.BaseModel `bun:"table:notebook_nodes"`

	NodeId                 string `bun:"id,pk"`
	NodeType               string `bun:"column:type"`
	ParentNodeId           string `bun:"column:parent_id"`
	UserID                 string `bun:"column:user_id,notnull"`
	NodeEngineType         string `bun:"column:engine_type"`
	NodeEncryptionStrategy string `bun:"column:encryption_strategy"`
	NodeMetadataPayload    []byte `bun:"column:metadata_payload"`
	NodeUpdatedAt          int64  `bun:"column:updated_at"`
	IsDeleted              bool   `bun:"column:is_deleted,default:false"`
}

func (r *NodeRepository) Save(ctx context.Context, n service.Node) error {
	model := &NotebookNode{
		NodeId:                 n.ID(),
		NodeType:               n.Type(),
		ParentNodeId:           n.ParentID(),
		UserID:                 n.UserID(),
		NodeEngineType:         n.EngineType(),
		NodeEncryptionStrategy: n.EncryptionStrategy(),
		NodeMetadataPayload:    n.MetadataPayload(),
		NodeUpdatedAt:          n.UpdatedAt(),
		IsDeleted:              n.IsDeleted(),
	}
	_, err := r.db.NewInsert().Model(model).
		On("CONFLICT (id) DO UPDATE SET parent_id = EXCLUDED.parent_id, user_id = EXCLUDED.user_id, engine_type = EXCLUDED.engine_type, encryption_strategy = EXCLUDED.encryption_strategy, metadata_payload = EXCLUDED.metadata_payload, updated_at = EXCLUDED.updated_at, is_deleted = EXCLUDED.is_deleted").
		Exec(ctx)
	return err
}

func (r *NodeRepository) FindByID(ctx context.Context, id, userID string) (service.Node, error) {
	nb := new(NotebookNode)
	err := r.db.NewSelect().Model(nb).Where("id = ? AND user_id = ?", id, userID).Scan(ctx)
	if err == nil {
		node := service.NewFullNode(nb.NodeId, nb.NodeType, nb.ParentNodeId, nb.UserID, nb.NodeEngineType, nb.NodeEncryptionStrategy, nb.NodeMetadataPayload, nb.NodeUpdatedAt, nb.IsDeleted)
		return node, nil
	}

	return nil, service.ErrNodeNotFound
}

func (r *NodeRepository) GetTree(ctx context.Context, rootId, userID string) ([]service.Node, error) {
	root, err := r.FindByID(ctx, rootId, userID)
	if err != nil {
		return nil, err
	}

	var results []service.Node
	results = append(results, root)

	queue := []string{rootId}
	for len(queue) > 0 {
		currentId := queue[0]
		queue = queue[1:]

		var children []NotebookNode
		if err := r.db.NewSelect().Model(&children).
			Where("parent_id = ? AND user_id = ? AND is_deleted = 0", currentId, userID).
			Scan(ctx); err == nil {
			for _, child := range children {
				node := service.NewFullNode(child.NodeId, child.NodeType, child.ParentNodeId, child.UserID, child.NodeEngineType, child.NodeEncryptionStrategy, child.NodeMetadataPayload, child.NodeUpdatedAt, child.IsDeleted)
				results = append(results, node)
				queue = append(queue, child.NodeId)
			}
		}

	}

	return results, nil
}

func (r *NodeRepository) Delete(ctx context.Context, id, userID string) error {
	_, err := r.db.NewUpdate().Table("notebook_nodes").
		Set("is_deleted = 1").
		Where("id = ? AND user_id = ?", id, userID).
		Exec(ctx)
	return err
}

func (r *NodeRepository) DeleteByNodeID(ctx context.Context, nodeId, userID string) error {
	// In the hybrid element-less model, this might delete children elements if they exist.
	_, err := r.db.NewUpdate().Table("notebook_nodes").
		Set("is_deleted = 1").
		Where("parent_id = ? AND user_id = ?", nodeId, userID).
		Exec(ctx)
	return err
}

func (r *NodeRepository) Search(ctx context.Context, query, userID string) ([]service.Node, error) {
	var nbs []NotebookNode
	q := r.db.NewSelect().Model(&nbs).Where("user_id = ? AND is_deleted = 0", userID)
	if query != "" {
		q = q.Where("name LIKE ?", "%"+query+"%")
	}
	err := q.Scan(ctx)
	if err != nil {
		return nil, err
	}

	results := make([]service.Node, len(nbs))
	for i, nb := range nbs {
		results[i] = service.NewFullNode(nb.NodeId, nb.NodeType, nb.ParentNodeId, nb.UserID, nb.NodeEngineType, nb.NodeEncryptionStrategy, nb.NodeMetadataPayload, nb.NodeUpdatedAt, nb.IsDeleted)
	}
	return results, nil
}

var _ service.StructureRepository = (*NodeRepository)(nil)
var _ service.ElementRepository = (*NodeRepository)(nil)
