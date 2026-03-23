# ADR-024: Plug-and-Play Drawing Engine Architecture

## Status
Accepted

## Context
As SpatialNotes evolves, we need a flexible way to switch between different engine modes (e.g., Canvas vs. Markdown) and ensure that the drawing experience is high-performance and isolated. 
The previous `CanvasBoard.tsx` contained too much logic (pan/zoom, cursor handling, some element rendering) that should be encapsulated within the engine itself to make it truly "plug-and-play" and standalone.

## Decision
We will refactor the `EngineInterface` to be minimal and decouple the "Note View Shell" from specific engine implementations using a standardized communication interface.

1.  **Engine Interface**: Defined in `packages/engine-core`, providing only the bare essentials for lifecycle, configuration, and data exchange. This package is shared by all engine implementations.
2.  **Full Encapsulation & Internal Decoupling**: 
    - **Coordinated Internal Architecture**: The engine implementation is further decoupled into specialized layers:
        - **`CanvasStore`**: Reactive state management (Viewport, Elements, Interaction).
        - **Unified Event System**: `CanvasStore.emitCommand` for consistency and undo/redo support.
        - **`Renderer` Strategy**: Dedicated rendering layer for SVG and HTML, abstracting the view from logic.
    - **Viewport & Interaction**: The engine manages its own coordinate transformations (pan/zoom) and DOM event listeners (pointer, wheel) via an `InteractionManager`.
    - **Rendering**: The engine renders all supported element types internally using the `Renderer` strategy.
    - **Internal State**: The engine manages its own element cache and viewport state via the `Store`.
3.  **Minimal Data Exchange**:
    - **`init(data, context)`**: Load initial state and configuration.
    - **`updateElements(elements)`**: Differential/Incremental update.
    - **`onCommand(cb)`**: Emit high-level commands (e.g., `CREATE`, `DELETE`) for real-time synchronization, bridged via the `CommandBus`.
4.  **Note View Shell Integration**: Instead of engines providing their own entire application shell, the main application will provide a `NoteViewShell` that mounts the engine's view component (e.g., `CanvasView`).

## Engine Interface (Unified)

```typescript
export interface EngineInterface<E extends BaseElement, T, V, C> {
    mount(container: HTMLElement): void;
    unmount(): void;
    init(data: { elements: E[]; viewport: V }, context: C): void;
    updateContext(context: Partial<C>): void;
    updateElements(elements: E[]): void;
    setTool(tool: T): void;
    sendCommand(command: { type: string; payload?: any }): void;
    onCommand(callback: (cmd: any) => void): void;
    destroy(): void;
}
```

## Consequences

### Positive
- **Plug-and-Play**: Different engines can be swapped easily.
- **Standalone Capability**: The engine can be tested and used as a standalone drawing library.
- **Cleaner UI Shell**: `CanvasInteractionView.tsx` becomes a thin wrapper that renders the engine's `<CanvasApp />` component.
- **Improved Performance**: Event handling and rendering are localized within the engine.

### Negative
- **Abstraction Overhead**: Requires careful design of the interface to accommodate different engine types.
- **Dual State**: Some state (like pan/zoom) might need to be synchronized with the UI shell for certain features (e.g., minimap).
