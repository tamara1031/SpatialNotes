# Design Spec: Phase 1 - Core Domain & Logic

## 1. Problem Statement
The current implementation in `packages/core/src/domain/` is partially aligned with the initial design but lacks the structural rigor of the refined Command Pattern and the `ELEMENT_` prefix protocol requirements. To ensure a solid foundation for real-time synchronization and Undo/Redo, the domain model needs to be fully updated.

## 2. Goals
- Align `NodeType` and `NodeRecord` with the refined protocol (using `ELEMENT_` prefixes).
- Implement the `CanvasCommand` interface and `CommandHistory` logic for local Undo/Redo.
- Refine the `Node` hierarchy to distinguish between structural containers (`FolderNode`, `PageNode`) and leaf content (`CanvasElement`).
- Enforce strict hierarchy validation (circular references) as defined in ADR-002.

## 3. Proposed Changes

### 3.1. `packages/core/src/domain/types.ts`
- Update `NodeType` to include: `FOLDER`, `NOTEBOOK`, `PAGE`, `ELEMENT_STROKE`, `ELEMENT_IMAGE`, `ELEMENT_TEXT`, `ELEMENT_TAPE`.
- Refine `NodeRecord` to match the `protocol-specification.md` (metadata focus).

### 3.2. `packages/core/src/domain/Node.ts`
- Maintain abstract base with `id`, `parentId`, and `updatedAt`.
- Enforce `setParent` logic with circular reference checks.

### 3.3. New: `packages/core/src/domain/CanvasCommand.ts`
- Define `CanvasCommand` interface: `execute(): void`, `undo(): void`.
- Implement `CommandHistory` class with `undoStack` and `redoStack`.

### 3.4. Refinement: `PageNode.ts` & `CanvasElement.ts`
- `PageNode`: Specialized node for handling a collection of `CanvasElements` within fixed physical dimensions.
- `CanvasElement`: Abstract leaf node supporting bounding box coordinates (`minX`, `minY`, `maxX`, `maxY`).

## 4. Implementation Plan
1. Update `types.ts` with new enums and interfaces.
2. Refactor `Node.ts` and subclasses (`FolderNode`, `NotebookNode`, `PageNode`) to use the new types.
3. Implement `CanvasCommand` and `CommandHistory`.
4. Create specific commands: `CreateElementCommand`, `DeleteElementCommand`, `MoveElementCommand`.

## 5. Verification Strategy (TDD)
- **Unit Tests**: Create `packages/core/tests/domain/Node.test.ts` and `Command.test.ts`.
- **SC-U1/U2/U3**: Verify circular reference and self-parenting errors.
- **SC-U7/U8**: Verify Command execution and reversion (Undo/Redo) logic.
