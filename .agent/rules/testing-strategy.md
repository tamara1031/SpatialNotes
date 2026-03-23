# SpatialNotes: Testing Strategy
# applyTo: (server/**/*_test.go | apps/web/**/*.test.ts | apps/web/**/*.spec.ts | tests/**/*.spec.ts)

## Integration & Behavioral Architecture (ADR-008, ADR-010)
Testing must verify the **real-time behavioral flow** between the user and the system.

## Backend (Go) Testing
- **Unit**: Verify `Domain` objects and `NodeFactory` logic.
- **Integration**: Use `httptest` to verify WebSocket broadcast loops and REST endpoint security.
- **Table-Driven Tests**: REQUIRED for complex logic paths.

## Frontend (React) Testing
- **Component**: Use **Vitest + RTL** to verify UI state and hook behavior.
- **State Integrity**: Verify Yjs CRDT synchronization logic by simulating concurrent updates.

## E2E (Playwright) Testing
- Focus on "The Golden Path": 
    - `Login -> Create Workspace -> Add Notebook -> Draw Stroke -> Sync -> Refresh -> Verify`.
- **Canvas Verification**: Use snapshot testing for PDF/Image export fidelity (Visual Regression).

## Quality Gate (ADR-008)
- No feature PR may be merged without coverage for its primary Use Case (Stage 2 design).
- Use `Fake` repositories for CI stability.
