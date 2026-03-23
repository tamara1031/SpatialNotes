# ADR-038: Infinite Canvas & Smart Pagination

## Status
Accepted

## Context
While SpatialNotes supports physical paper sizes ([ADR-003](./003-absolute-size-canvas.md)), users often require a boundless "Infinite Mode" for brainstorming. However, infinite canvases are notoriously difficult to export to standard PDF/Print formats without cutting content in half.

## Decision
We implement a hybrid coordinate strategy that allows for infinite vertical/horizontal expansion while maintaining "Ghost" structural cues for eventual pagination.

### 1. Infinite Mode Characteristics
- **Visual Boundaries**: Dotted-line page boundaries appear as subtle guides (Ghost cues).
- **Dynamic Grids**: Grids fade in during stylus proximity or high-zoom interaction to maintain a sense of scale.

### 2. Smart PDF Fitting (Pagination Algorithm)
When exporting boundless content:
- **Natural Gutter Detection**: The engine analyzes spatial data to identify horizontal/vertical whitespace ("gutters") where page breaks can be inserted without intersecting ink strokes or elements.
- **Page Break Preview**: A specialized UI mode allows users to manually adjust these automatically suggested break points before final export.

### 3. Navigation
- **Cluster-Aware Zoom**: Double-tap on a logical group of elements automatically fits that cluster to the viewport.
- **GPS Mini-Map**: A high-level overview overlay reveals the user's current spatial position within the larger document.

## Consequences
- **Positive**: Provides the freedom of an infinite whiteboard with the professional output of a paginated notebook.
- **Negative**: Increased complexity in the background serialization and export logic inside `packages/canvas-engine`.
