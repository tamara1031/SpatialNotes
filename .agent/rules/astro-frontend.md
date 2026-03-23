# SpatialNotes: Astro Frontend Rules
# applyTo: apps/web/**/*.astro, apps/web/**/*.tsx, apps/web/**/*.ts

## UI Architecture: Island Architecture
- **Astro Components (`.astro`)**: Static UI shell, layout, and routing. Zero JS by default.
- **React Islands (`.tsx`)**: High-interaction components (Canvas, Sidebar, Modals). Use `client:load` or `client:idle` for hydration.
- **`src/application`**: Global state and coordination (Yjs Context).
- **`src/infrastructure`**: Wasm loading, API clients, and WebSocket adapters.

## Performance: Wasm-Powered Engine
- **`canvas-wasm` (Rust)**: Mandatory for mathematical computations (smoothing, pressure, intersection).
- **`canvas-engine` (TS)**: Bridge between Wasm and the DOM/2D Canvas API.
- **Canvas 2D API**: Primary rendering method.

## Styling: Vanilla CSS & Design Tokens
- **No Tailwind**: Use Vanilla CSS with CSS Modules or global scoped styles.
- **Design Tokens**: Reference variables from `docs/design/0-requirements/ui-design-system.md`.
- Focus on premium aesthetics: smooth gradients and interactive feedback.

## Real-time Sync (ADR-008, ADR-019)
- **Yjs CRDT**: Primary source of truth for canvas content.
- Treat Wasm updates as deterministic; JS/TS layer orchestrates synchronization.

## Testing
- **Vitest**: For domain logic and Wasm-bridge testing.
- **Playwright**: For E2E flows ("Create -> Draw -> Sync -> Persist").
