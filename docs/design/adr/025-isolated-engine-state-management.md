# ADR-025: Isolated Engine State Management and Persistence Strategy

## Status
Accepted

## Context
In a local-first application like SpatialNotes, synchronization and data reliability are paramount. While `apps/web` manages global state via Yjs, drawing engines (Canvas, Markdown) require low-latency state updates and robust protection against data loss during long interaction sessions.

## Decision
We will shift internal state management for active editing sessions to the engine implementation, supported by an isolated persistence layer.

1.  **Engine as State Owner**: During an active session (e.g., when a notebook page is open), the engine is the primary owner of the current element state and viewport configuration, managed via a reactive **`CanvasStore`**.
2.  **Internal Command Queue**: The engine handles interaction events via an `InteractionManager` and updates its internal `CanvasStore` immediately. It uses a **`CommandBus`** to bridge these actions to the application layer only when an atomic action is completed.
3.  **Local Cache (DLP)**: The engine maintains its own lightweight local cache (e.g., `localStorage`) to prevent data loss in case of browser crashes before the application layer has synced to IndexedDB/Yjs.
4.  **Sync-on-Checkpoint**: The application layer retrieves the full engine state (`getSnapshot()`) during major checkpoints (e.g., switching pages, manual save, or periodically) to ensure global consistency.

## Rationale
- **Performance**: Reducing the frequency of Yjs transactions for every intermediate stroke point improves responsiveness.
- **Reliability**: Isolated cache provides a redundant safety net for the most volatile data (active handwriting).
- **Simplicity**: Minimizing the `EngineInterface` makes it easier to implement and test new engine types (like a Markdown-based editor).

## Consequences

### Positive
- **High-Fidelity Interaction**: Interaction logic is closer to the hardware/OS event loop.
- **Robust Recovery**: Multiple layers of persistence (Engine Cache -> IndexedDB -> Server).
- **Decoupled Architecture**: Engines can be tested in isolation without Yjs infrastructure.

### Negative
- **State Divergence Risk**: Requires careful management of the synchronization boundary between the Engine and the application.
- **Implementation Complexity**: Engines must handle their own persistence logic.
