# Design Spec: Phase 2 - Backend & Persistence

## 1. Problem Statement
The backend needs a robust and performant persistence layer that supports polymorphic node hierarchies and spatial queries. Following ADR-001, ADR-012, and the refined ER diagram, the implementation must use a partitioned model while providing a clean abstraction via a `DBClient` interface.

## 2. Goals
- Implement the `DBClient` SQL wrapper interface in Go.
- Create engine-specific adapters (starting with SQLite via `modernc.org/sqlite`).
- Build the `NodeRepository` to handle partitioned routing across `NotebookNodes`, `Pages`, and `PageElements`.
- Ensure structural integrity through application-level recursive logic (UC6).

## 3. Proposed Changes

### 3.1. `server/internal/domain/repository/db_client.go`
- Define `DBClient` interface:
  ```go
  type DBClient interface {
      Exec(query string, args ...any) error
      Query(query string, args ...any) (*sql.Rows, error)
      QueryRow(query string, args ...any) *sql.Row
      Close() error
  }
  ```

### 3.2. `server/internal/infrastructure/persistence/sqlite/`
- Implement `SqliteClient` using `modernc.org/sqlite`.
- Provide schema migration logic for the partitioned tables.

### 3.3. `server/internal/domain/repository/node_repository.go`
- Define `NodeRepository` interface for domain-level persistence.
- Implement `SqliteNodeRepository` which uses `DBClient` to perform CRUD across partitioned tables.

### 3.4. Refinement: Recursive Logic
- Implement `RecursiveDelete` in the application layer to purge sub-trees and associated elements safely.

## 4. Implementation Plan
1. Define the `DBClient` interface and base error types.
2. Implement the SQLite adapter and schema creation.
3. Build the repository with partitioned routing logic.
4. Implement behavioral tests for recursive deletion and spatial coordinate storage.

## 5. Verification Strategy (TDD)
- **Unit Tests**: Create `server/internal/infrastructure/persistence/sqlite/sqlite_test.go`.
- **SC-I1**: Verify deep equality after persistence (save -> findById).
- **SC-I2**: Verify recursive tree retrieval matches the ER hierarchy.
