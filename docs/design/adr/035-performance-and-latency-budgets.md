# ADR-035: Performance and Latency Budgets

## Status
Accepted

## Context
A digital handwriting experience is deeply sensitive to latency. Any delay over 20-30ms is perceptible to the user, and delays over 50ms break the illusion of writing on paper.

## Decision
We establish strict **Latency Budgets** for the entire system:

1.  **Inking Latency (Active Layer)**:
    -   **Budget**: <16ms (one animation frame).
    -   **Mechanism**: Rust/Wasm engine handles coordinate interpolation. Pointer events are processed and rendered to a "Current Stroke" layer immediately, bypassing the main application state where possible.
2.  **Local Persistence Latency**:
    -   **Budget**: Invisible (0ms perceived).
    -   **Mechanism**: Local IndexedDB saves are asynchronous but triggered immediately after a command is dispatched.
3.  **Synchronization Latency**:
    -   **Budget**: Acceptable 10-30s (Debounced).
    -   **Mechanism**: Cloud syncing is decoupled from the interaction thread via debouncing (ADR-032).
4.  **UI Responsiveness**:
    -   **Budget**: <100ms for button clicks/navigation.

## Consequences
-   **Positive**: Premium "Magic Desk" feel; reliable user experience even under heavy canvas load.
-   **Negative**: Requires careful profiling and optimization; active layer rendering necessitates complex decoupling from the main SVG/HTML tree.
