# ADR-034: Unified Domain Logic and Mirroring Strategy

## Status
Accepted

## Context
When business rules (e.g., folder depth limits, node naming constraints) are implemented only on the frontend, the backend risks data corruption. Conversely, implementing them only on the backend leads to poor UX (round-trip delays).

## Decision
We enforce **Unified Domain Logic** by mirroring core business rules between the TypeScript and Go layers.

1.  **TypeScript Domain (`packages/core`)**: Acts as the primary reference for frontend validation and entity modeling.
2.  **Go Domain (`apps/server/internal/domain`)**: Mirrors the logic from `packages/core` to ensure final write-integrity at the database level.
3.  **Mirroring Rules**:
    -   Any constraint check (e.g., "Folder name cannot be empty") must exist in both `core` (for instant feedback) and `apps/server` (for security).
    -   Complex logic (e.g., spatial calculations) is prioritized in Rust/Wasm or `packages/core` and called by the backend if possible, or mirrored exactly.

## Consequences
-   **Positive**: High data integrity; consistent behavior across frontend and backend; zero-latency user feedback.
-   **Negative**: Maintenance overhead of updating logic in two places; potential for drift if not carefully managed during refactoring.
