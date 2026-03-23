# ADR-028: Materialization API for Hierarchy Index

## Status
Approved

## Context
With the removal of real-time WebSocket synchronization (ADR-019/ADR-030), the backend SQL tables now serve as the primary persistent index for the single-user experience. We need a reliable way to sync the local Yjs state to the backend for search and hierarchy management.

## Decision
1.  **Dual-Track Materialization**: The frontend shall be responsible for "materializing" the state of nodes into the SQL database via a dedicated REST API.
2.  **REST API for Nodes**:
    - `POST /api/nodes`: Upserts a node (Chapter, Notebook).
    - `DELETE /api/nodes/:id`: Soft-deletes a node in the SQL index.
3.  **Yjs remains the Source of Truth for Real-time Content**: Fine-grained canvas elements (Strokes, Tape) will continue to rely solely on Yjs blobs to minimize network overhead. Only structural nodes (Chapters, Notebooks) will be mirrored to SQL for indexing.

## Consequences
- **Positive**: Enables backend search and global folder views.
- **Negative**: Adds "dual-write" complexity to the frontend.
- **Neutral**: The SQL index may be slightly stale if an API call fails, but Yjs will eventually reconcile it on the next valid update.
