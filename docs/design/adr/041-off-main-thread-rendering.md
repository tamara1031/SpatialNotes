# ADR-041: Off-Main-Thread Rendering Architecture

## Status
Accepted | Implemented (v0.6.0)

## Context
As the complexity of the Rust/WASM drawing engine grew (including spatial hashing and WebGPU rendering), executing all computations on the browser's main thread began to cause "jank" (dropped frames) during high-frequency pointer interactions. This is especially problematic for professional-grade drawing tools where latency budgets are strictly sub-16ms.

## Decision
We decided to move the entire `CanvasEngine` (WASM module) and its rendering logic to a dedicated Web Worker.

1.  **CanvasWorker**: A background thread that hosts the WASM instance and manages the high-frequency state.
2.  **WorkerBridge**: An asynchronous message-passing layer to synchronize state between the UI thread and the worker.
3.  **OffscreenCanvas**: Control of the WebGPU rendering surface is transferred to the worker via `transferControlToOffscreen()`.
4.  **Zero-Copy Logic**: Direct access to WASM linear memory buffers for interaction points to avoid serialization overhead.

## Consequences

### Positive
- **Near-Zero UI Latency**: The main thread is never blocked by engine ticks or rendering passes.
- **Scalability**: Complex computations (like predictive rendering or SVG export) happen in the background.
- **Stability**: Main thread crashes or hangs are less likely to occur due to drawing engine load.

### Negative
- **Asynchronous Interaction**: Tools and services must now handle `Promise`-based responses from the engine.
- **Communication Overhead**: `postMessage` introduces a small serialization/transfer cost, mitigated by binary views.

## Related
- [ADR-021: Full Rust Ink Engine](./021-full-rust-ink-engine.md)
- [ADR-035: Latency Budgets](./035-performance-and-latency-budgets.md)
