# Design Spec: Large-Scale Design Reorganization and Improvement

**Date:** 2026-03-23  
**Status:** Draft  
**Topic:** Transitioning to Clean/Hexagonal Architecture for SpatialNotes  

---

## 1. Executive Summary
This design reorganizes the SpatialNotes codebase to improve maintainability, scalability, and testability. By adopting a **Clean/Hexagonal Architecture**, we decouple the core domain (Notes, Chapters, Hierarchy) from external technical concerns like Yjs (CRDT), IndexedDB (Persistence), and WebWorkers (Encryption). This ensures the "Magic Desk" foundation is robust enough to support multiple engines (Canvas, Markdown) and secure E2EE vaults.

## 2. Goals & Constraints
*   **Simplicity:** Reduce cognitive load by consolidating redundant sync/crypto layers.
*   **SOLID/DDD:** Enforce strict boundaries; domain logic should not know about infrastructure.
*   **Performance:** Offload heavy operations (E2EE, large syncs) to background threads.
*   **UX First:** Ensure "Optimistic UI" updates for a responsive feel.
*   **Testability:** Enable 100% unit test coverage for core logic without a browser/DOM.

## 3. Architecture Overview

### 3.1 Layers
1.  **Domain Layer (`src/core/domain`):** 
    *   **Entities:** `Node`, `Chapter`, `Notebook`. 
    *   **Value Objects:** `VaultState` (Locked/Unlocked/Unlocking), `Position`.
    *   **Repository Interfaces:** `INodeRepository`.
    *   **Output Ports (Interfaces):** `INodePresenter` (to push updates to reactive stores).
2.  **Application Layer (`src/core/application`):** Use cases (`CreateNode`, `SyncVault`, `UnlockVault`). These use cases **MUST** check the `VaultState` before performing any operations on nodes.
3.  **Infrastructure Layer (`src/core/infrastructure`):** 
    *   **Adapters:** `YjsNodeRepository` (implements `INodeRepository`), `NanostoreNodePresenter` (implements `INodePresenter`).
    *   **Services:** `WebWorkerCryptoProvider`.
4.  **Presentation Layer (`src/components`):** UI components (Astro/React) that subscribe to **Nanostores**. Nanostores act as "Read Models" updated by the `NanostoreNodePresenter`.

### 3.2 Component Mapping
| Original Component | New Component | Layer |
| :--- | :--- | :--- |
| `SyncService`, `SyncManager` | `SyncUseCase` & `YjsNodeRepository` | App / Infra |
| `CryptoService` | `ICryptoProvider` (Interface) | Domain |
| `CryptoWorkerProxy` | `WebWorkerCryptoProvider` | Infrastructure |
| `ActiveEngineStore` | `Nanostores` (as Read Models) | Presentation |

## 4. Key Use Cases & Edge Cases

### 4.1 Node Creation
1.  **UI:** Calls `CreateNodeUseCase.execute()`.
2.  **App:**
    *   **Lock Check:** Verifies `VaultState` is `Unlocked`. If `Locked`, returns a `VaultLockedError`.
    *   **Logic:** Creates a `Node` entity.
    *   **Persistence:** Calls `INodeRepository.save(node)`.
3.  **Infra:** `YjsNodeRepository` updates the CRDT.
4.  **Reactivity:** The repository triggers the `INodePresenter` to update the Nanostores.

### 4.2 Sync & Conflict Resolution
*   **Binary Conflicts:** Handled automatically by Yjs (CRDT).
*   **Semantic Conflicts:** The `Application` layer (via a `ConsistencyService`) is responsible for resolving high-level conflicts, such as parent-child cycles or duplicate structural names, before presenting data to the UI.
*   **Vault Locking:** When the vault is `Locked`, all network sync is paused, and sensitive data is purged from memory. The `SyncUseCase` will queue outgoing updates if appropriate, or simply fail until unlocked.

## 5. Testing & Validation Strategy
*   **Domain:** Unit tests for `VaultState` transitions and `Node` logic.
*   **Application:** Use case tests with mocked repositories to verify "Lock Check" logic and "Conflict Resolution".
*   **Infrastructure:** Integration tests against Yjs/IndexedDB.
*   **E2E:** Playwright tests for the "Vault Unlock -> Create Note -> Sync" flow.


## 6. Implementation Roadmap
1.  **Phase 1:** Define core interfaces and domain entities in `src/core/domain`.
2.  **Phase 2:** Implement `YjsNodeRepository` and `SyncUseCase`.
3.  **Phase 3:** Migrate UI components to use the new Application layer and Nanostores.
4.  **Phase 4:** Remove legacy redundant components.
