# ADR-001: Hybrid Partitioned Persistence Model

## Context
SpatialNotes needs to handle both small, hierarchical metadata (Folders, Notebooks) and high-volume drawing data (Strokes). A "Unified Node" table (Single Table Inheritance) causes "meaningful NULLs" and risks slow performance on structural queries.

## Decision
We adopt a **Hybrid Partitioned Model**:
1.  **`NotebookNode` table**: Metadata only (Folders, Notebooks, Chapters).
2.  **`CanvasElement` table**: Bulk canvas content (Strokes, Images) linked directly to structural nodes.

## Status
Accepted

## Consequences
- **Positive**: High performance for sidebar navigation; normalized metadata (no NULLs); efficient I/O for canvas drawing.
- **Negative**: Requires application-level logic to maintain the cross-table hierarchy; multiple queries/joins to reassemble a full notebook.
