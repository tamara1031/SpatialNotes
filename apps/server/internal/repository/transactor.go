package repository

import (
	"context"
	"database/sql"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/uptrace/bun"
)

// NodeTransactor implements service.Transactor using bun's RunInTx. It
// creates a fresh NodeRepository bound to the transaction so every NodeWriter
// call inside fn participates in the same SQLite transaction. If fn returns
// an error the transaction is rolled back; otherwise it is committed.
type NodeTransactor struct {
	db *bun.DB
}

func NewNodeTransactor(db *bun.DB) *NodeTransactor {
	return &NodeTransactor{db: db}
}

func (t *NodeTransactor) RunInTx(ctx context.Context, fn func(ctx context.Context, w service.NodeWriter) error) error {
	return t.db.RunInTx(ctx, &sql.TxOptions{}, func(ctx context.Context, tx bun.Tx) error {
		txRepo := newNodeRepositoryFromIDB(tx)
		return fn(ctx, txRepo)
	})
}

var _ service.Transactor = (*NodeTransactor)(nil)
