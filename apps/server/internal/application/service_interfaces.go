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

// AuthService defines the authentication operations required by AuthHandler.
// Using an interface decouples the handler from the concrete AuthService,
// enabling straightforward unit testing without a real JWT/bcrypt stack.
type AuthService interface {
	GetSalts(ctx context.Context, email string) (string, string, error)
	Register(ctx context.Context, email, saltAuth, saltEncryption, wrappedDEK, authToken string) (string, error)
	Login(ctx context.Context, email, authToken string) (string, string, error)
}
