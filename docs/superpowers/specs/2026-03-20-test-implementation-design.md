# Design Spec: Test Implementation Strategy (Quality Gates)

## 1. Problem Statement
While the core logic has been implemented and basic tests exist, the current test suite lacks coverage for polymorphic node creation, the Visitor pattern traversal, real-time synchronization integrity, and advanced gesture-based operations (Erasure). To ensure the "Magic Desk" experience is reliable, these missing quality gates must be implemented.

## 2. Goals
- Implement `NodeFactory` unit tests (SC-U4/U5) to verify polymorphic instantiation.
- Implement `Visitor` pattern tests (SC-U6) to verify recursive tree traversal.
- Implement `SyncAdapter` integration tests (SC-I3) for binary Yjs merges.
- Implement `System` tests (SC-S1/S2) for collaborative move and gesture erasure.

## 3. Proposed Changes (Red-Green-Refactor)

### 3.1. Phase A: Domain & Shared Interfaces (`packages/core` & `packages/engine-core`)
- **EngineInterface.test.ts**: Verify that `EngineInterface` correctly defines the contract for Note Engines and handles generic types.
- **NodeFactory.test.ts**: Verify that JSON records are correctly mapped to domain nodes in `packages/core`.

### 3.2. Phase B: Sync & Protocol (`apps/web`)
- **YjsAdapter.test.ts**: Simulate two client connections and verify CRDT convergence for stroke data.
- **CollaborativeMove.test.ts**: Verify that moving a node on one client updates the state on another.

### 3.3. Phase C: Advanced Interactions (`tests/e2e`)
- **Eraser.test.ts**: Verify that a "gesture path" correctly identifies and removes target elements.
- **Visual Regression**: Baseline checks for PDF export fidelity.

## 4. Implementation Plan
1. Start with Phase A (Unit Tests) to solidify the domain model.
2. Proceed to Phase B (Integration) to verify real-time behaviors.
3. Conclude with Phase C (System/E2E) for high-fidelity gesture verification.

## 5. Verification Strategy
- **fresh verification evidence**: All tests must pass with 0 failures.
- **Red-Green Verification**: Watch each test fail before implementation.
