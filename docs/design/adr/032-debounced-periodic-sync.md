# ADR-032: Periodic and Debounced Synchronization Strategy (Confluence-style)

## Status
Accepted

## Context
Our initial MVP requirements specified real-time sync with sub-500ms latency across devices (UC1). While effective for collaborative environments, broadcasting every single stroke immediately via WebSockets creates significant load on the backend server. Given our shift to a "Single-user Multi-device" model (ADR-030), this is unnecessary overhead.

Furthermore, research into tools like Confluence reveals important UX considerations regarding auto-save:
- **False Sense of Security**: Users often assume "Auto-save" means data is safe on the server, leading to data loss if background syncs fail silently.
- **Psychological Closure**: Power users still heavily rely on manual saves (`Ctrl+S`) or explicit "Save/Publish" buttons to feel confident their work is committed.
- **Editor Hitching**: Frequent network operations can cause UI stutters ("ghost cursors") if not carefully decoupled from the main interaction thread.

## Decision
We will transition from a strict real-time broadcast model to a **periodic, debounced background sync** orchestrated by the `apps/web` application shell, combined with explicit user controls.

1.  **Instant Local-First Save**: All interactions update the in-memory `CanvasStore` and are immediately persisted to local IndexedDB (ADR-017). This guarantees zero data loss locally without waiting for the network.
2.  **Debounced Cloud Sync (Auto-Save)**: The `web` shell will intercept engine commands and debounce network synchronization.
    -   Changes are accumulated and synced to the Go server periodically (e.g., every 10-30 seconds of inactivity, or on a max-wait interval).
3.  **Manual Sync Trigger**: We will provide a persistent "Save to Cloud" button in the UI header and support `Ctrl+S` / `Cmd+S` keyboard shortcuts to force an immediate background sync.
4.  **Zero Data Loss Policy & Clear Visual Feedback**: 
    -   **Policy**: IndexedDB is the primary source of truth for the local session. Data must be committed to local storage before any network attempt.
    -   **Feedback**: The `web` shell must display the exact sync status (e.g., "Unsaved changes", "Saving to Cloud...", "All changes saved") to prevent the "false sense of security" problem. If the server is unreachable, the UI must clearly state "Saved locally (Offline)".
    -   **Indicators**: Provide Confluence-style explicit UI indicators and a manual "Save to Cloud" button in the header.
5.  **Centralized Control**: This debouncing and sync state management will live entirely within `apps/web` (e.g., a `useSync` hook or `SyncManager`), keeping the engines (`canvas-engine`, Markdown) completely ignorant of network timing.

## Consequences
-   **Positive (Server Load)**: Drastically reduces WebSocket/HTTP traffic and database writes.
-   **Positive (UX)**: Provides users with clear psychological closure (Manual Save) and transparent system status, avoiding Confluence's silent failure pitfalls.
-   **Negative (Latency)**: Secondary devices will see changes on a delay (10-30s) rather than instantly, which is acceptable for single-user workflows.
