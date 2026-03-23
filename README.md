# SpatialNotes: The Magic Desk

## Prerequisites

This project requires the following tools to be installed on your system:

- **Node.js** (v18+) & **pnpm** (v10+): For frontend and workspace management.
- **Go** (v1.22+): For the backend synchronization server.
- **Rust** (v1.75+): For the high-performance Wasm ink engine.
- **wasm-pack**: To compile Rust to WebAssembly.
  - Install via: `cargo install wasm-pack`

## Quick Start
1. `make setup` - Install dependencies and build core packages (Wasm/TS).
2. `make dev`   - Start both Frontend and Backend concurrently.

## Monorepo Layout (Go Backend + Astro Frontend + Rust Engine)

- **Presentation (`apps/web/src`)**: Astro UI shell (Island Architecture).
- **Web Internal Packages (`apps/web/packages/`)**:
  - **`canvas-wasm`**: Rust/Wasm ink core.
  - **`canvas-engine`**: High-level adapter between Wasm and the UI.
  - **`core`**: Shared web domain logic.
- **Infrastructure (`apps/server`)**: Go backend for persistence and synchronization.

Refer to the detailed [Directory Structure](docs/design/adr/016-directory-structure-refactoring.md) and [Architecture Decision Records (ADR)](docs/design/adr/) for more info.

## Quality Gate (Force Multiplier)
This project uses **Agent Skills** to automate quality checks. See `.agent/skills/` for details.

## Implementation Status
- [x] Design Phase (ICONIX 0-5)
- [x] Project Initialization
- [/] Skills Implementation [/]
- [ ] Core Domain Logic (Node Hierarchy)
