# ADR-014: MVP Concurrency and Undo Strategy

## Context
SpatialNotes needs a way to handle concurrent edits and allow undoing actions. Hand-writing operations require a robust mechanism to revert state without data loss.

## Decision
1.  **Command Pattern**: Implement all canvas-altering operations (Create, Delete, Move) as **Command Objects**. This encapsulates the logic for both forward execution and backward reversion (`execute()`/`undo()`).
2.  **Undo/Redo Scope**: Implement **Local-Only Undo Stack** via a `CommandHistory` entity. An undo action on Device A does not affect the undo stack on Device B.
3.  **Concurrency Model**: Use **Yjs CRDT** as the underlying data provider. Commands interface with the Yjs Doc to ensure eventual consistency.
4.  **MVP Performance Limits**: 
    - Max 50 pages per notebook.
    - Max 500 elements per page.
5.  **No Auth/User Mgmt**: Security is limited to the URL token in MVP.

## Status
Accepted

## Consequences
- **Positive**: Clean separation of concerns (SOLID); easy to implement new operation types; reliable undo state.
- **Negative**: Memory overhead for the local command history stack.
