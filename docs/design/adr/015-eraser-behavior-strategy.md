# ADR-015: Eraser Behavior Strategy (MVP vs Future)

## Context
Standard handwriting applications offer two types of erasers: "Stroke Eraser" (removes entire lines) and "Standard Eraser" (partially erases/splits lines). We need to decide which to implement for the SpatialNotes MVP to balance user experience and implementation complexity.

## Decision
We initially implemented **Stroke Erasure** as the MVP behavior. However, we have since upgraded the system to use **Partial Erasure** as the primary behavior:
1.  **Behavior**: The eraser uses a specific radius (e.g. 4mm) to hit-test against the `points` array of any stroke (`ELEMENT_STROKE` or `ELEMENT_TAPE`).
2.  **Implementation**: We use the `PartialEraseVisitor` which removes the points within the eraser radius, splits the remaining points into new fragments, and issues commands to delete the original element and create the new fragments.
3.  **Undo Support**: The Yjs `UndoManager` handles the transaction natively—reverting the deletion of the original element and the creation of the new fragments in a single step.

## Status
Accepted (Upgraded from Stroke Erasure)

## Consequences
- **Positive**: High precision for users; matches the expectations set by apps like GoodNotes; fully supports Undo/Redo patterns.
- **Negative**: Increased complexity in calculation logic and higher sync overhead (creating new elements requires generating new UUIDs and more Yjs synchronization).
