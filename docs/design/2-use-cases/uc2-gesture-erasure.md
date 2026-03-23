# Use Case UC2: Gesture-based Erasure

| Item | Description |
| :--- | :--- |
| **Primary Actor** | User (Stylus/Tablet user) |
| **Preconditions** | Canvas is active; at least one `StrokeElement` exists. |

1. **User** activates the **Eraser Tool**.
2. **User** traces a path across existing strokes.
3. **System** (Interaction Layer) captures the pointer path.
4. **System** (Interaction Layer) calls the `EraserService` (Control Layer) directly.
5. **System** (Domain Layer: `EraserService`) performs a spatial query and identifies hit elements.
6. **System** (Domain Layer: `EraserService`) optimistically applies the deletion or stroke splitting directly to the `CanvasStore` (Entity).
7. **System** (Domain Layer: `EraserService`) emits a Command via the `CanvasStore` to broadcast changes via Yjs.

## 2. Alternative Flows

**A1: Precision Eraser Mode** (Stroke splitting): The `EraserService` calculates the intersection points and splits the `StrokeElement` into multiple new segments instead of deleting the whole element.
**A2: Stroke Eraser Mode**: The `EraserService` marks the entire intersected element for deletion.

## 3. Post-conditions
- **Success**: Intersected elements are removed/modified according to the active mode.
- **Sync**: Changes are propagated to all connected devices within 500ms.
- **Undo**: The entire eraser stroke can be undone as a single atomic action (UC7).
