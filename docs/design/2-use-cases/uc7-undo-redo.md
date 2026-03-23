# Use Case UC7: Local Undo/Redo (Yjs Native)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Student |
| **Preconditions** | Canvas Interaction View is active; at least one operation has been performed. |
| **Basic Flow (Undo)** | 1. **User** (Actor) triggers "Undo" via keyboard shortcut (Ctrl+Z) or UI button.<br>2. System emits an **UNDO** command via the **CanvasStore** (Control).<br>3. **CanvasStore** (via Yjs) automatically reverts the latest transaction in the *Notebook/Elements Maps* (Entity).<br>4. System refreshes the **SpatialNote View** (Boundary). |
| **Basic Flow (Redo)** | 1. **User** (Actor) triggers "Redo" via keyboard shortcut (Ctrl+Shift+Z/Ctrl+Y) or UI button.<br>2. System emits a **REDO** command via the **CanvasStore** (Control).<br>3. **CanvasStore** (via Yjs) automatically re-applies the reverted transaction in the *Notebook/Elements Maps* (Entity). |
| **Post-condition** | The canvas returns to the previous state using Yjs transactional integrity (Convergence) without custom manual command history stacks. |
