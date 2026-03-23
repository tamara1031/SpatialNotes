# Backend & Persistence (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Go persistence layer with a partitioned SQLite backend and DBClient abstraction.

**Architecture:** Repository Pattern with a SQL wrapper interface (DBClient) and application-level referential integrity.

**Tech Stack:** Go, modernc.org/sqlite.

---

### Task 1: Define DBClient Interface and Errors

**Files:**
- Create: `server/internal/domain/repository/db_client.go`
- Create: `server/internal/domain/repository/errors.go`

- [ ] **Step 1: Define the DBClient interface**

```go
package repository

import (
	"database/sql"
)

type DBClient interface {
	Exec(query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
	Close() error
}
```

- [ ] **Step 2: Commit**

```bash
git add server/internal/domain/repository/
git commit -m "feat(backend): define DBClient interface and base repository types"
```

---

### Task 2: Implement SqliteClient and Schema

**Files:**
- Create: `server/internal/infrastructure/persistence/sqlite/sqlite_client.go`
- Create: `server/internal/infrastructure/persistence/sqlite/migrations.go`

- [ ] **Step 1: Implement SqliteClient**

```go
package sqlite

import (
	"database/sql"
	_ "modernc.org/sqlite"
)

type SqliteClient struct {
	db *sql.DB
}

func NewSqliteClient(dsn string) (*SqliteClient, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	return &SqliteClient{db: db}, nil
}
// ... implement DBClient methods
```

- [ ] **Step 2: Define partitioned schema in migrations.go**

```go
const CreateSchema = `
CREATE TABLE IF NOT EXISTS NotebookNodes (...);
CREATE TABLE IF NOT EXISTS Pages (...);
CREATE TABLE IF NOT EXISTS PageElements (...);
`
```

- [ ] **Step 3: Commit**

```bash
git add server/internal/infrastructure/persistence/sqlite/
git commit -m "feat(backend): implement SqliteClient and partitioned schema"
```

---

### Task 3: Build NodeRepository with Partitioned Routing

**Files:**
- Create: `server/internal/domain/repository/node_repository.go`
- Create: `server/internal/infrastructure/persistence/sqlite/node_repository.go`
- Test: `server/internal/infrastructure/persistence/sqlite/node_repository_test.go`

- [ ] **Step 1: Write integration test for partitioned save (SC-I1)**

```go
func TestSqliteNodeRepository_Save(t *testing.T) {
    // ... setup SqliteClient with in-memory DSN
    // ... repository.Save(node)
    // ... verify deep equality from DB
}
```

- [ ] **Step 2: Implement partitioned routing logic**

```go
func (r *SqliteNodeRepository) Save(n domain.Node) error {
    switch n.Type() {
    case "FOLDER", "NOTEBOOK":
        return r.saveToNodes(n)
    case "PAGE":
        return r.saveToPages(n)
    default:
        return r.saveToElements(n)
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/internal/domain/repository/ server/internal/infrastructure/persistence/sqlite/
git commit -m "feat(backend): implement partitioned NodeRepository and integration tests"
```
