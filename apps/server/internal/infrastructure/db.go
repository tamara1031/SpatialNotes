package infrastructure

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/tamara1031/spatial-notes/apps/server/internal/repository"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/extra/bundebug"
	_ "modernc.org/sqlite"
)

func NewDB(driver, dsn string) (*bun.DB, error) {
	var db *sql.DB
	var err error
	var bunDB *bun.DB

	switch driver {
	case "sqlite":
		// Add SQLite pragmas for concurrency and performance
		dsnWithPragmas := fmt.Sprintf("%s?_busy_timeout=5000&_journal_mode=WAL&_foreign_keys=on", dsn)
		db, err = sql.Open("sqlite", dsnWithPragmas)
		if err != nil {
			return nil, fmt.Errorf("failed to open sqlite: %w", err)
		}
		// For SQLite, limit connections to 1 for better reliability with WAL
		db.SetMaxOpenConns(1)
		bunDB = bun.NewDB(db, sqlitedialect.New())
	default:
		return nil, fmt.Errorf("unsupported driver: %s", driver)
	}

	bunDB.AddQueryHook(bundebug.NewQueryHook(
		bundebug.FromEnv("BUNDEBUG"),
	))

	return bunDB, nil
}

func CreateSchema(ctx context.Context, db *bun.DB) error {
	models := []interface{}{
		&repository.User{},
		&repository.Authenticator{},
		&repository.NotebookNode{},
		&repository.NodeUpdateModel{},
		&repository.RoomUpdateModel{},
	}

	for _, model := range models {
		_, err := db.NewCreateTable().
			Model(model).
			IfNotExists().
			Exec(ctx)
		if err != nil {
			return err
		}
	}

	// Create indices
	indices := []struct {
		table  string
		column string
		name   string
	}{
		{"notebook_nodes", "parent_id", "idx_nodes_parent_id"},
		{"node_updates", "node_id", "idx_node_updates_node_id"},
		{"room_updates", "room_id", "idx_room_updates_room_id"},
	}

	for _, idx := range indices {
		_, err := db.NewCreateIndex().
			Table(idx.table).
			Index(idx.name).
			Column(idx.column).
			IfNotExists().
			Exec(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func DropSchema(ctx context.Context, db *bun.DB) error {
	models := []interface{}{
		&repository.User{},
		&repository.Authenticator{},
		&repository.NotebookNode{},
		&repository.NodeUpdateModel{},
		&repository.RoomUpdateModel{},
	}

	for _, model := range models {
		_, err := db.NewDropTable().Model(model).IfExists().Exec(ctx)
		if err != nil {
			return err
		}
	}
	return nil
}
