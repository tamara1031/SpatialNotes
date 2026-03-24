# Detailed Design: Canvas Engine

## Status
Accepted

## Context/Goal
The Canvas Engine is the core high-performance component of SpatialNotes, responsible for handling low-latency ink interaction, spatial indexing, and complex geometric calculations. It provides a boundless "Infinite Mode" for brainstorming while supporting absolute-size physical pages for professional output.

## Architecture
The engine follows a hybrid architecture with a performance-critical core implemented in Rust (compiled to WebAssembly) and a thin TypeScript wrapper for UI integration.

- **Frontend (TypeScript)**: Manages the `CanvasStore`, handles UI events, and marshals data to the Wasm core.
- **Core (Rust/Wasm)**: Handles all heavy computation including spatial hashing, collision detection (R-Tree), stroke manipulation, and SVG/PDF export.

## Components
- **Spatial Index (R-Tree/Spatial Hashing)**: Leverages the `rstar` crate in Rust for optimized spatial queries. Elements are indexed by their bounding boxes (`min_x`, `max_x`, `min_y`, `max_y`).
- **Partial Eraser**: A precision tool that splits strokes into new fragments by removing points within a defined radius. Implemented via the `PartialEraseVisitor` in Rust.
- **Wasm Interaction Layer**: Uses `serde-wasm-bindgen` for efficient data transfer between the main thread and the engine worker.
- **Stroke Lifecycle Manager**: Manages the creation, point accumulation, and finalization of `CanvasElement` objects.
- **Ghost Grid/Pagination**: Provides visual cues for physical page boundaries in infinite mode and identifies "natural gutters" for smart PDF fitting during export.

## Sequence/Data Flow
### 1. Stroke Interaction (UC9)
1. **User Input**: The `InteractionManager` captures pointer events (pressure, tilt).
2. **Prediction**: The `CanvasTool` uses an offscreen canvas for immediate predictive rendering to minimize perceived latency.
3. **Processing**: Points are sent via a `WorkerGateway` to the `CanvasWorker`.
4. **Engine Update**: The Rust-based `WasmEngine` updates the active stroke and performs spatial checks.
5. **State Sync**: The `CanvasStore` is notified of updates, which are then synchronized with the domain layer.

### 2. Erasure Logic
1. **Hit-Test**: The eraser path is checked against the spatial index to identify potentially affected elements.
2. **Splitting**: For each hit, the points within the eraser radius are removed.
3. **Reification**: The original element is marked for deletion, and new `CanvasElement` fragments are created for the remaining stroke segments.

## Testing Considerations
- **Performance Benchmarks**: Ensure sub-16ms latency for complex drawings with >1000 elements.
- **Precision Verification**: Unit tests for `PartialEraseVisitor` to ensure strokes are split correctly without geometry artifacts.
- **Export Fidelity**: Visual regression tests comparing in-app rendering with generated SVG/PDF output.
- **Spatial Hash Integrity**: Verify the index is correctly updated during element movement, resizing, and deletion.
