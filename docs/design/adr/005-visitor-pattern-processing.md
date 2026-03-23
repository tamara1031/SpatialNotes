# ADR-005: Visitor Pattern for Extensible Element Processing

## Context
As the number of `CanvasElement` types (Stroke, Image, Text) and operations (PDF Export, Intersection Testing, Search) grows, adding these methods directly to the element classes leads to "God Classes" and violates the Open-Closed Principle.

## Decision
We adopt the **Visitor Pattern**:
1.  Define a `PageElementVisitor` interface with methods for each element type (`visitStroke`, `visitText`, etc.).
2.  Each `CanvasElement` implements an `accept(visitor)` method.
3.  Complex algorithms (like PDF Export or Hit Detection) are implemented as concrete Visitors.

## Status
Accepted

## Consequences
- **Positive**: Clean separation of data (Entities) and algorithms (Services); easy to add new operations (e.g., SVG export) without modifying existing classes.
- **Negative**: Adding a *new element type* requires updating all existing visitors.
