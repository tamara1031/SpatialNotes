# SpatialNotes: TypeScript Shared Rules
# applyTo: packages/core/**/*.ts

## Domain Integrity
- **Rich Domain Models**: Classes (e.g., `Node`, `CanvasElement`) must encapsulate their own logic and validation.
- **NodeRecord Symmetry**: Every domain object MUST implement `toRecord(): NodeRecord` to maintain the shared contract with the Backend.

## Pattern: Factory & Polymorphism
- Use `NodeFactory` for creating specific Node subtypes from DTOs.
- Use the **Visitor Pattern** (ADR-005) for processing different canvas element types (Strokes, Text, Images).

## Command Pattern for Undo/Redo
All user operations that modify the canvas state MUST:
1.  Implement the `CanvasCommand` interface (`execute()`, `undo()`).
2.  Be processed via the `CommandHistory` stack to ensure local consistency.
3.  Use the `ELEMENT_` prefix for protocol-related type constants.

## Shared Mathematics (ADR-003)
- Use absolute coordinates for all canvas elements to ensure reproducibility across devices and PDF exports.
- Shared math utilities in `packages/core` are the source of truth for all spatial calculations.

## Quality Control
- **Vitest**: All shared logic MUST have unit tests.
- **Biome**: Follow the project's Biome configuration for linting and formatting.
