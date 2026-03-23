# ADR-007: Spatial Hashing for Efficient Intersection Testing

## Status
Accepted

## Context
As users create dense sketches, a single `Page` may contain thousands of `Stroke` elements. Traditional "Loop through all elements" for gesture erasure (UC2) or rendering optimizations becomes O(N^2) or excessively slow.

## Decision
We will implement **Spatial Hashing** at the application/domain layer:
1.  The `Page` node maintains a 2D grid index of its children.
2.  Each `CanvasElement` is registered in the grid based on its **Bounding Box** (stored in DB as `min_x`, `max_x`, etc.).
3.  Queries (like "What is at this point?") only check elements in the relevant grid cells.
4.  The DB-level bounding boxes serve as the source of truth for rebuilding the in-memory spatial hash.

## Consequences
- **Positive**: Near O(1) time complexity for point-in-element queries; critical for zero-lag gesture erasure.
- **Positive**: Direct synergy with DB-level spatial queries.
- **Negative**: Adds memory overhead; requires updating the hash when elements are moved or resized.
