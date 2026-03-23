# ADR-026: Spatial Selection and Cross-Workspace Clipboard Strategy

## Status
Accepted

## Context
As the drawing engine matures, users need to manipulate existing elements. This requires a robust selection mechanism (range selection/lasso) and the ability to move, cut, copy, and paste elements. Crucially, the "Copy & Paste" functionality must work not just within the same page, but across pages, notebooks, and completely different browser tabs (cross-workspace), behaving similarly to professional tools like draw.io or Figma.

## Decision
We will implement an integrated Spatial Selection and Clipboard system within the `CanvasEngine` and `WasmEngine`.

1.  **Selection Mechanism (Wasm + TS)**:
    - **Selector Tool**: A new interaction mode in the engine. Dragging creates a selection bounding box.
    - **Wasm Query**: The `WasmEngine` will expose a `query_selection(min_x, min_y, max_x, max_y)` method to efficiently retrieve elements intersecting the bounding box using the existing R-Tree.
    - **State**: `CanvasEngine` manages an array of `selectedElementIds`. Selected elements are visually highlighted.
2.  **Drag and Drop (Move)**:
    - When elements are selected, dragging them updates their coordinates visually.
    - To prevent spamming the sync engine, the visual move is handled locally within the engine during the drag. A single `UPDATE` command is emitted on `pointerup` (Drop) for the translated elements.
3.  **Cross-Workspace Clipboard**:
    - We extend the `SpatialNote JSON (SNJ)` format defined in ADR-011 to support an `elements` payload.
    - **Copy/Cut**: Serializes the selected `NodeRecord` objects to a JSON string wrapped in the SNJ envelope and writes it to the OS clipboard using the `navigator.clipboard.writeText()` API.
    - **Paste**: Reads the OS clipboard. If valid SNJ elements are found, it generates *new UUIDs* for all elements, adjusts their coordinates to the current viewport/cursor position, and emits `CREATE` commands.
    - **Format**:
      ```json
      {
        "version": "1.0",
        "source": "spatial-notes",
        "type": "elements",
        "payload": [ { "type": "ELEMENT_STROKE", "metadata": {...} }, ... ]
      }
      ```

## Consequences

### Positive
- **Fluid UX**: Batch moving and organizing elements becomes possible.
- **Interoperability**: Standard JSON via the OS clipboard allows pasting between tabs.
- **Performance**: Wasm R-Tree ensures selection queries are fast.

### Negative
- **Clipboard Permissions**: Requires users to grant clipboard permissions in the browser.
- **Complex State**: Dragging requires maintaining a temporary "dragging" visual state decoupled from the committed Yjs state until the drop occurs.
