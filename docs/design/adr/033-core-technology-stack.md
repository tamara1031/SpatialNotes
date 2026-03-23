# ADR-033: Core Technology Stack (3-Stack Synergy)

## Status
Accepted

## Context
SpatialNotes requires a balance of high-performance ink rendering, robust backend infrastructure, and a modern, maintainable web interface. We need to leverage technologies that excel in their respective domains while maintaining a cohesive full-stack developer experience.

## Decision
We adopt a **3-Stack Synergy** model leveraging Go, Astro, and Rust:

1.  **Go (Infrastructure)**: Used for the backend server (`apps/server`) and SyncHub.
    -   **Rationale**: Excellent concurrency primitives (goroutines), fast compilation, and robust standard library for HTTP/WebSockets.
2.  **Astro (Presentation)**: Used for the web UI shell (`apps/web`).
    -   **Rationale**: High-performance "Island Architecture" that minimizes client-side JavaScript by default while allowing interactive components (Islands) where needed.
3.  **Rust/Wasm (Engine Core)**: Used for the low-level ink engine (`packages/canvas-wasm`).
    -   **Rationale**: Deterministic, low-latency mathematical computations for Catmull-Rom interpolation and spatial hashing. Compiles to WebAssembly for near-native performance in the browser.

## Consequences
-   **Positive**: Each component uses the "best tool for the job." Sub-10ms perceived latency for inking; Type-safe communication via shared protocols.
-   **Negative**: Increased build system complexity (managing Rust, Go, and Node.js toolchains); Requires developers to be proficient in multiple languages.
