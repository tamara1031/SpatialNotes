# ADR-027: Unified Undo/Redo Strategy for Yjs Maps

## Status
Approved

## Context
SpatialNotes uses separate Yjs Maps for structural nodes (`nodesMap`) and canvas elements (`elementsMap`). Currently, these are tracked by separate `Y.UndoManager` instances. This leads to several issues:
1.  **Transactional Inconsistency**: Deleting a node and its elements within one transaction cannot be easily undone by a single user action.
2.  **Implementation Complexity**: UI code must manually manage and synchronize multiple undo calls.
3.  **Order of Operations**: Undoing a node deletion might succeed while element restoration fails or happens out of order.

## Decision
1.  **Unified UndoManager**: Replace the separate `nodeUndoManager` and `undoManager` with a single `Y.UndoManager` that tracks both `nodesMap` and `elementsMap`.
    ```typescript
    export const undoManager = new Y.UndoManager([nodesMap, elementsMap]);
    ```
2.  **Yjs-Native Undo Stack**: Deprecate the manual `CommandHistory` for canvas-altering operations in favor of the Yjs native `UndoManager`. This ensures correct behavior in collaborative sessions.
3.  **Command Pattern as Logic Wrappers**: Keep the `Command` pattern (ADR-014) to encapsulate the *logic* of execution (e.g., recursive deletion), but rely on Yjs transactions to capture the resulting changes for undoing.
4.  **Transaction Scoping**: All operations that affect both maps (e.g., Note Deletion) MUST be wrapped in a single Yjs transaction to ensure they appear as a single entry in the unified undo stack.

## Consequences
- **Positive**: Simplified UI code; guaranteed transactional integrity across all maps; correct collaborative undo behavior.
- **Negative**: The `UndoManager` must now track a larger set of changes, slightly increasing the memory footprint of the undo stack.
