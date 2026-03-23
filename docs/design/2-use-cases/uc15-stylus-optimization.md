# Use Case 15: Stylus Input Optimization

## 1. Summary
Ensures a premium, zero-latency handwriting experience on web-based tablets. Captures rich stylus data (pressure, tilt) and renders it with high precision while maintaining object-level flexibility for subsequent manipulation.

## 2. Actors
- User (Stylus user)
- InteractionHandler (Event Capturer)
- CanvasEngine (Renderer)
- DrawingService (Domain Logic)

## 3. Preconditions
- Canvas is open.
- Stylus/Pen tool is selected.

## 4. Main Flow
1. **User Action**: Touches the screen with a stylus.
2. **System Action (InteractionHandler)**: Captures `pointerdown` with `pointerType: 'pen'`.
3. **System Action (InteractionHandler)**: Enables `requestAnimationFrame` loop for predicted stroke rendering.
4. **User Action**: Moves the stylus.
5. **System Action (InteractionHandler)**: Captures `pointermove` with high-frequency sampling, including `pressure`, `tiltX`, and `tiltY`.
6. **System Action (CanvasEngine)**: Renders a "prediction stroke" on a top-layer canvas for immediate feedback (<16ms).
7. **System Action (DrawingService)**: Appends points to the official `ELEMENT_STROKE` in the store.
8. **User Action**: Lifts the stylus.
9. **System Action (CanvasEngine)**: Finalizes the stroke, applies smoothing (B-Spline), and re-renders to the main SVG/Canvas layer.
10. **System Action (SelectionService)**: The new stroke becomes a selectable object.

## 5. Alternate Flows
- **A1: Interaction Conflict**: If a finger touch is detected while drawing (Palm rejection), the system ignores the touch.
- **A2: Tool Switching**: User uses the stylus button or double-tap (supported by hardware) to switch to eraser.

## 6. Business Rules
- **Rule 15.1**: Latency from input to ink MUST be below 16ms (60fps).
- **Rule 15.2**: Pressure data MUST influence the stroke width dynamically.
- **Rule 15.3**: Strokes MUST remain individual objects (SVG or Metadata-backed) to allow moving, scaling, and color changes after drawing.
- **Rule 15.4**: The system MUST ensure **Visual Stability**. Strokes MUST be rendered at their absolute coordinates relative to the Notebook origin, preventing any "shifting" after finalization.
- **Rule 15.5**: Predicted ink MUST be visually indistinguishable from final ink to provide a seamless "fluid" feel.
