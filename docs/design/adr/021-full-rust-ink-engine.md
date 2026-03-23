# ADR-021: Full Rust Ink Engine Implementation

## Status
4: Accepted

## Context
High-performance spatial note-taking apps require extreme reliability and low latency for operations like spatial indexing, collision detection, and stroke manipulation.
Initially, `canvas-engine` was implemented in TypeScript, which is suitable for UI logic but less optimal for high-frequency mathematical operations and complex data structures like R-Trees.

## Decision
We will migrate all core computational logic from `packages/canvas-engine` (TypeScript) to `packages/canvas-wasm` (Rust).

1.  **Full Rust Computation Core**:
    - **Stateful Engine**: A `CanvasEngine` struct in Rust maintains the `RTree` and page metadata.
    - **Spatial Indexing**: Leverages the `rstar` crate for optimized spatial queries.
    - **Eraser Logic**: All erasure (stroke-based and precision splitting) is implemented in Rust.
    - **SVG Export**: The entire SVG generation, including coordinate formatting and XML assembly, is handled in Rust.

2.  **Ultra-Thin TS Wrapper**:
    - `packages/canvas-engine` is reduced to a thin adapter that marshals `NodeRecord` data into Rust-compatible `Element` structs.
    - No significant business logic remains in TypeScript.

## Consequences

### Positive
- **Determinism**: No micro-stutters from JavaScript GC during heavy calculation.
- **Performance**: Near-native speed for spatial queries and complex geometry math.
- **Robustness**: Leverage Rust's type system and safety features for low-level math.

### Negative
- **Integration Cost**: Marshaling complex objects between JS and Wasm requires careful handling of serialization (Serde).
- **Tooling dependency**: Rust and `wasm-pack` are now mandatory for engine development.
