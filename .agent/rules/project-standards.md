# SpatialNotes: Project Standards
# applyTo: **/*

## Core Philosophy: ICONIX + DDD
All features MUST follow the ICONIX-inspired design flow located in `docs/design/`.
1. **Requirements (Stage 0)**: Define the vision and UI tokens.
2. **Domain Analysis (Stage 1)**: Sync with the `Ubiquitous Language`.
3. **Use Cases (Stage 2)**: Map user actions to system behavior.
4. **Robustness (Stage 3)**: Bridge the gap between UC and Design.
5. **Data Model (Stage 4)**: Define the physical storage.
6. **Detailed Design (Stage 5)**: Class and Sequence diagrams.

## Monorepo Coordination
- **`packages/core`**: The single source of truth for shared types and business logic (TS).
- **`packages/canvas-wasm`**: Performance-critical ink engine (Rust/Wasm).
- **`apps/web`**: Astro frontend (Island Architecture), dependent on `core` and `canvas-engine`.
- **`apps/server`**: Go backend, MUST maintain structural symmetry with `core` and follow the DIP layout.
- **Design Synchronization**: Documentation in `docs/design` (PUML diagrams and ADRs) MUST be synchronized with implementation changes. A feature is NOT complete until its ADR and diagrams reflect reality.

## Commit Standards
- Format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.
- Example: `feat(canvas): implement WebP conversion pipeline as per ADR-040`

## Concurrency & Performance (ADR-014, ADR-031)
- **Flattened Hierarchy**: No `Page` entity. Elements link directly to `Notebook`.
- **MVP Capacity**: 
    - Optimized for up to 10,000 total elements per notebook.
    - Max 5 levels of folder/chapter nesting.

## Communication & workflow
- Use `task_boundary` and `task.md` for any non-trivial task.
- Be proactive in verifying design docs when ambiguity arises.
