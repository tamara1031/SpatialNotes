# ADR-019: Synchronization Protocol (Yjs over WebSocket)

## Status
Superseded (by [ADR-030: Single-user Multi-engine Architecture](030-single-user-multi-engine-architecture.md))

## Context
We need a real-time, low-latency sync mechanism that handles both hierarchical metadata (folders) and high-density canvas data (strokes) without manual "Save" buttons.

## Decision
SpatialNotes uses **Yjs (CRDT)** as the primary synchronization protocol, delivered via **WebSockets**.

### 1. Technical Protocol Specification
This document defines the interface between the **Astro/React Frontend** and **Go Backend**.

#### 1.1. Unified Node Record (JSON)
The `NodeRecord` is the single source of truth for both structural hierarchy and canvas content.

```json
{
  "id": "uuid-v4",
  "parentId": "uuid-v4 | null",
  "type": "CHAPTER | NOTEBOOK | ELEMENT_STROKE | ELEMENT_IMAGE | ELEMENT_TEXT | ELEMENT_TAPE",
  "name": "string (for hierarchy)",
  "metadata": {
    "points": "number[] (for stroke)",
    "src": "string (for image)",
    "content": "string (for text)",
    "z_index": "number (for elements)",
    "hidden": "boolean (for tape toggle)"
  },
  "updatedAt": "timestamp (ms)"
}
```

### 2. Synchronization Layer (Yjs)
- **Protocol**: `y-websocket` binary protocol.
- **Go Hub Role**:
    - Manage active connections.
    - Forward binary deltas (`[]byte`) to all clients EXCEPT the sender.
    - Periodically persist the `Y.Doc` state back to the database.
- **State Partitioning**: To ensure performance, structural nodes (Chapters, Notebooks) are loaded initially, while canvas elements are streamed per-notebook as the user navigates.

### 3. Interaction Strategy & Backend Domain
- **Shared Symmetry**: Both Astro/React and Go implement the `Node` hierarchy, but with different focuses:
    - **Frontend (TS/Wasm)**: Focuses on **Rendering, Interaction, and Performance-critical Spatial Logic**.
    - **Go (Back)**: Focuses on **Structural Integrity, Recursive Operations, and Persistence**.
- **Recursive Deletion**: When a `Chapter` is deleted via API, the Go backend is responsible for identifying and purging all nested `Notebooks` and `CanvasElements` to prevent "Orphan Nodes" in the database.
- **Validation**: Go validates `parentId` transitions (e.g., preventing circular references) as a secondary safety net to the frontend.

## Consequences
- **Positive**: Zero-conflict synchronization; extremely low latency; resilient to network drops.
- **Negative**: Increased memory usage on the client for large documents; binary Yjs deltas are difficult to debug manually.
