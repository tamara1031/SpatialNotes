# Use Case UC3: Leveraging Rich Learning Elements (ICONIX Style)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Student |
| **Preconditions** | **Canvas Interaction View** is active; a Notebook is open. |
| **Basic Flow (Rich Element Creation)** | 1. **User** interacts with the **Canvas Interaction View** (Boundary).<br>2. System delegates the interaction to **WorkerGateway** (Control) asynchronously.<br>3. **WorkerGateway** forwards events to **CanvasWorker** (Control) for low-latency Rust/WASM processing.<br>4. **CanvasWorker** returns the finalized data.<br>5. **DrawingService** (Control) optimistically updates the **CanvasStore** (Entity).<br>6. **CanvasStore** (Entity) emits a "Change Event" to notify subscribers and trigger synchronization. |
| **Alternate Flow (Infinite Mode Drawing)** | 1. **User** accesses a Canvas set to `INFINITE` Layout Mode.<br>2. System renders a **Dot Grid Background** (Boundary) spanning the infinite view, while ensuring the underlying SVG is fully accessible for `pointer-events`.<br>3. **User** draws strokes unrestricted by page boundaries. |
| **Alternate Flow (Toolbar Stability)** | 1. **User** switches between tools (e.g., Pen, Eraser, Selector) via **Canvas Toolbar** (Boundary).<br>2. System maintains toolbar layout stability by persistently keeping all contextual action buttons (e.g., Bring to Front, Send to Back) rendered, merely dimming them when inactive. |
| **Post-condition** | Diverse learning elements are integrated seamlessly across different canvas layout modes, creating a stable and visually reassuring environment. |
