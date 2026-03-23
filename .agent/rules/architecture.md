# Architecture Directives

## Premise: 3-Stack Synergy
The application architecture relies strictly on the synergy between Go (backend), Astro (frontend layer / static pages), and Rust (Wasm-based performance critical tasks). Ensure seamless and secure interoperability.

## UX-First Philosophy
The infinite canvas, note-taking performance, and drawing flow are the core priorities. Maintain performance, especially for pen tablet devices, through techniques like lazy loading and minimal binary sizes.

## Strict DDD/SOLID Adherence
Domain-Driven Design (DDD) and SOLID principles must be strictly enforced.
Decouple features using well-defined interfaces. Prevent tight coupling and arbitrary feature bloat.

## ADR Authority
Architecture Decision Records (ADRs) within `docs/design/adr/` are the absolute authority on system design. New architectural changes or library selections must be recorded as new ADRs.

## ICONIX Flow
The ICONIX process is to be strictly followed. Confirm Use Case -> Update Robustness Diagram -> Reflect in Detailed Design.

## Mandatory Testing
Robust unit tests, edge case testing, error handling, and end-to-end tests are mandatory. Every feature modification requires test coverage verification.
