# ADR-008: Integrated Tech Stack & Testing Strategy

## Context
We need a performant, lightweight, and design-centric stack that supports real-time synchronization and a premium canvas experience. We also need a clear strategy for ensuring the reliability of this high-interaction system.

## Decision
We adopt a **3-Layer Architecture (Astro + Rust/Wasm + Go)**:

### 1. Infrastructure: Go (Golang)
- **Role**: High-performance API and Sync Gateway (WebSockets).
- **Testing**: 
    - **Unit Tests**: Domain logic and NodeFactory.
    - **Integration Tests**: WebSocket broadcast logic via `httptest`.

### 2. Presentation: Astro (Island Architecture)
- **Role**: UI Shell and Interactive React Islands.
- **Technology**: Astro for static layout, React for high-interaction islands (Canvas, Sidebar).
- **Testing**:
    - **Component Tests**: **Vitest + React Testing Library**.
    - **E2E Tests**: **Playwright** for "Create -> Draw -> Sync" flows.

### 3. Implementation: Shared "Fakes" Strategy

To keep tests predictable, fast, and decoupled from brittle infrastructure (like databases or real network calls), we use **Fakes** (In-memory implementations) instead of complex mocks:
- `FakeNodeRepository`: An in-memory Map of Nodes.
- `FakeSyncGateway`: A simple array-based log of broadcasted messages.
- `FakeFileSystem`: For testing absolute-size PDF exports without actual disk I/O.

### 4. Dependency Injection Enforcement
If a service cannot be tested with a Fake, it must be refactored to use Dependency Injection. This ensures all components remain testable across the multi-stack environment.

### 5. Engine Core: Rust (WebAssembly)
- **Role**: Performance-critical ink mathematics (smoothing, pressure).
- **Testing**:
    - **Unit Tests**: Rust-side tests (`cargo test`).
    - **Bridge Tests**: Vitest-based verification of the Wasm-to-TS bridge.

## Status
Superseded by [ADR-020](./020-astro-wasm-island-architecture.md)

## Consequences
- **Positive**: Near-native performance for ink; minimal JS bundle via Island Architecture.
- **Negative**: Increased build complexity (3 languages).
