package application

import (
	"context"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

type NodeService interface {
	SaveNode(ctx context.Context, n service.Node) error
	MoveNode(ctx context.Context, id, newParentId string) error
	GetNode(ctx context.Context, id string) (service.Node, error)
	DeleteNode(ctx context.Context, id string) error
	SearchNodes(ctx context.Context, query string) ([]service.Node, error)
	SaveUpdate(ctx context.Context, update *service.NodeUpdate) error
	GetUpdates(ctx context.Context, nodeId string) ([]*service.NodeUpdate, error)
}
