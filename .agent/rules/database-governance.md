# SpatialNotes: Database Governance
# applyTo: (server/internal/infrastructure/persistence/**/*.go | docs/design/4-data-model/*.puml)

## Partitioning Strategy (ADR-001)
SpatialNotes uses a physical-spatial partition model to handle high-frequency ink updates.
- **`NotebookNodes` Table**: Structural metadata (Folders, Notebooks). Minimal updates.
- **`Pages` Table**: Layout and size information for each notebook page.
- **`PageElements` Table**: High-volume canvas data (Strokes, Images). Optimized for `page_id` clustering.

## Logical Integrity (ADR-004)
- **Soft Foreign Keys**: Avoid database-level cascading deletes for elements. 
- **Application-Level Cleanup**: Use the service layer in `server/internal/application` to handle deletions across partitions.
- **No Heavy ORMs**: Maintain raw control over SQL to optimize for SQLite-specific features (e.g., FTS5 for search).

## Storage Strategy (ADR-013)
- **Hybrid Storage**: 
    - Content < 100KB: Base64 in `elements.data`.
    - Content > 100KB: Use `BlobStore` interface (external storage).
    - Database references MUST use URI-like identifiers (e.g., `blob://uuid`).
