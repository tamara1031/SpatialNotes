# ADR-036: Development Standards and DRY Policy

## Status
Accepted

## Context
In a multi-language (Go, TypeScript, Rust) monorepo with shared packages, inconsistent coding standards and duplicated logic can lead to maintenance nightmares, "split-brain" bugs, and increased onboarding time for new developers.

## Decision
We enforce a strict **DRY (Don't Repeat Yourself)** policy and standardized development patterns across all packages.

1.  **Logic Location (DRY)**:
    -   If logic is needed by both `apps/web` and another package, it **must** live in `packages/core` or `packages/canvas-engine`.
    -   If logic is needed by both `packages/core` (TS) and `apps/server` (Go), it should follow the **Unified Domain Logic** pattern ([ADR-034](./034-unified-domain-logic-mirroring.md)).
2.  **Domain-First Development**:
    -   New features must start with domain entity or service definitions in `packages/core` (TypeScript) or `internal/domain` (Go) before UI or persistence implementation.
3.  **Encapsulation**:
    -   Packages must have a clear "Public API" (e.g., `index.ts` in TS packages). Internal implementation details should not be leaked.
    -   Avoid "cross-package leakage": `apps/web` should interact with `canvas-engine` only through the `EngineInterface`.
4.  **Formatting & Linting**:
    -   Standardized tools (e.g., Biome for TS, `go fmt` for Go, `cargo fmt` for Rust) are mandatory and enforced via CI.

## Rationale
-   **Maintainability**: Centralizing logic reduces the surface area for bugs.
-   **Consistency**: A "Single Source of Truth" for business rules prevents drift between frontend and backend.
-   **Velocity**: Clear standards reduce decision fatigue during implementation.

## Consequences
-   **Positive**: Reduced technical debt; higher confidence in system-wide changes.
-   **Negative**: Initial overhead of moving logic into shared packages; requires discipline to maintain boundaries.
