# ADR-012: Database Abstraction & Multi-Engine Support

## Status
Accepted

## Context
SpatialNotes needs to support multiple database backends (SQLite for local/edge, Postgres/MySQL for server-side clusters). The persistence layer must map a polymorphic Node hierarchy to a partitioned ER model (Nodes, Pages, Elements).

## Decision
1. **Interface-First Design**: All database operations will be defined via a `NodeRepository` interface in the Go `internal/domain/repository` layer.
2. **SQL Wrapper Interface (`DBClient`)**: To allow swapping underlying drivers while maintaining raw SQL control, we use a common `DBClient` interface. This interface wraps `database/sql` methods (`Exec`, `Query`, `QueryRow`) and is implemented by engine-specific adapters.
3. **Adapter Pattern**: Engine-specific logic (SQLite, Postgres, etc.) will reside in `internal/infrastructure/persistence/[engine]`, implementing the `DBClient` or being used by the `NodeRepository`.
4. **Driver Choice**: For SQLite, use `modernc.org/sqlite` (CGO-free) to ensure cross-platform portability.
5. **Partitioned Routing**: The repository implementation is responsible for routing `Node` subtypes to their respective tables:
    - `Folder`, `Notebook`, `Chapter` -> `notebook_nodes` table.
    - `CanvasElement` (Stroke, Image, etc.) -> `canvas_elements` table.

## Consequences
- **Positive**: Easy to switch databases via configuration/dependency injection.
- **Positive**: High performance via engine-specific optimizations (e.g., WAL mode for SQLite).
- **Negative**: Manual SQL mapping is required for each adapter (avoiding heavy ORMs to maintain precise control over the partitioned schema).
