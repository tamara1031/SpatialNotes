# ADR-029: Tool Strategy Pattern and Unified Interaction Layer

## Status
Accepted

## Context
The `CanvasEngine` has grown in complexity, accumulating logic for multiple tools (Pen, Eraser, Picker, Lasso, Text, Tape) and managing both SVG and HTML rendering. This violates the Single Responsibility Principle (SRP) and makes the engine difficult to extend (Open/Closed Principle). 

Additionally, a bug was identified where `TextElement` (HTML-based) cannot be selected or deleted because pointer events are captured by the HTML elements and do not reach the SVG layer where `CanvasEngine` listeners are attached.

## Decision
We will refactor the interaction logic into a decoupled **Tool Strategy Pattern** and unify event handling under a single **Interaction Manager**.

1.  **Interaction Manager**:
    - A new class that owns all pointer event listeners (`pointerdown`, `pointermove`, `pointerup`).
    - It is attached to the parent container (`paperSurface`) rather than a specific layer, ensuring it captures all hits.
    - It maintains the list of elements and the viewport context.
    - It delegates logic to the `activeTool`.

2.  **Tool Strategy Pattern**:
    - Define a `CanvasTool` interface:
      ```typescript
      interface CanvasTool {
          onPointerDown(e: PointerEvent, ctx: InteractionContext): void;
          onPointerMove(e: PointerEvent, ctx: InteractionContext): void;
          onPointerUp(e: PointerEvent, ctx: InteractionContext): void;
          onDoubleClick?(e: MouseEvent, ctx: InteractionContext): void;
          onKeyDown?(e: KeyboardEvent, ctx: InteractionContext): void;
          getCursor(): string;
      }
      ```
    - Define `InteractionContext` to provide a decoupled interface:
      ```typescript
      interface InteractionContext {
          store: CanvasStore;
          bus: CommandBus;
          renderer: CanvasRenderer;
          wasmEngine: any;
          getMmCoords(e: PointerEvent | MouseEvent): { x: number, y: number };
          dispatch(action: CanvasAction): void;
          render(): void;
      }
      ```
    - Implement concrete tools: `DrawingTool`, `EraserTool`, `SelectionTool`.

3.  **Refined Hit Testing**:
    - Unify hit testing for all element types (Ink, Tape, Text, Image) within a single utility used by `InteractionManager`.
    - `ELEMENT_TEXT` and `ELEMENT_IMAGE` selection bugs will be resolved by ensuring the `InteractionManager` captures events at the container level and correctly identifies the target element via coordinate-based hit testing.

4.  **Export Logic**:
    - Implement `exportToSVG()` in `CanvasEngine` to fulfill the standalone requirement and fix the broken Export button in the UI.

## Consequences

### Positive
- **SOLID Compliance**: High maintainability and easy extensibility for new tools.
- **Reliability**: Unified event handling prevents layer-shadowing bugs.
- **Standalone Integrity**: Engine becomes more self-contained and testable.

### Negative
- **Initial Refactor Cost**: Requires significant changes to `CanvasEngine.ts`.
- **Indirection**: Slightly more complex to follow the call stack through the strategy delegator.
