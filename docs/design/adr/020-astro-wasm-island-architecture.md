# ADR-020: Astro + Rust/Wasm + Go Island Architecture

## Status
Proposed

## Context
High-fidelity ink rendering in SpatialNotes requires low latency and high precision. 
While React is excellent for UI management, the overhead of the virtual DOM and JavaScript's garbage collection can introduce micro-stutters during intensive pen strokes. 
Furthermore, the mathematical operations for ink smoothing and pressure calculation are performance-intensive and benefit from low-level optimizations.

## Decision
We will transition to a 3-stack architecture that leverages the strengths of each platform:

1.  **Astro (TypeScript) - Frontend/UI Shell:**
    - Manages the overall page structure, routing, and static layouts.
    - Utilizes **Island Architecture** to hydrate interactive components (e.g., the canvas, sidebar) only where necessary.
    - Reduces the main thread JavaScript burden for static UI elements.

2.  **Rust (Wasm) - Performance-Critical Logic (Ink Engine):**
    - The core mathematical computations (e.g., stroke smoothing, pressure-sensitive geometry, spatial indexing) will be implemented in Rust and compiled to WebAssembly.
    - This provides near-native execution speed and consistent performance.
    - Rust acts as a "pure engine" that does not directly interact with the DOM.

3.  **Go - Backend & Infrastructure:**
    - Manages data persistence, authentication, and real-time synchronization.
    - Provides a robust, single-binary server for easy deployment and scalability.

## Roles & Responsibilities

| Language | Layer | Responsibility |
| :--- | :--- | :--- |
| **Go** | Infrastructure | Persistence, Auth, Sync (Yjs over WebSocket). |
| **Astro/TS** | Presentation | UI Components, Layout, Event Handling (DOM). |
| **Rust/Wasm** | Application Core | Intensive mathematical calculations for canvas paths. |

## Consequences

### Positive
- **Deterministic Performance:** Rust/Wasm provides consistent execution speed for complex ink math.
- **Smaller Frontend Bundle:** Astro's zero-JS-by-default approach minimizes unnecessary scripts.
- **Clear Separation of Concerns:** Mathematical logic is strictly isolated from UI logic.

### Negative
- **Build Complexity:** Requires `wasm-pack` and an integrated build pipeline for 3 distinct languages.
- **Context Switching:** Developers need to move between Go, TypeScript, and Rust.
- **Integration Overhead:** Passing data between JS and Wasm incurs a small cost (minimized by efficient data structures).
