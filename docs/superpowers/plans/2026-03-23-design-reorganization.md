# Design Reorganization and Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize SpatialNotes into a Clean/Hexagonal Architecture to improve maintainability and testability.

**Architecture:** We use a 4-layer approach: Domain (entities/interfaces), Application (use cases), Infrastructure (adapters), and Presentation (Astro/React components with Nanostores).

**Tech Stack:** TypeScript, Yjs, Nanostores, Vitest, Playwright.

---

### Phase 1: Domain Layer Foundation

**Goal:** Define the core entities and interfaces without external dependencies.

#### Task 1: Define VaultState Value Object
**Files:**
- Create: `apps/web/src/core/domain/vault/VaultState.ts`
- Test: `apps/web/src/core/domain/vault/VaultState.test.ts`

- [ ] **Step 1: Write the failing test**
```typescript
import { expect, test } from 'vitest';
import { VaultState } from './VaultState';

test('VaultState should transition correctly', () => {
    const state = VaultState.Locked();
    expect(state.isLocked()).toBe(true);
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm test apps/web/src/core/domain/vault/VaultState.test.ts`
- [ ] **Step 3: Write minimal implementation**
```typescript
export class VaultState {
    private constructor(private value: 'LOCKED' | 'UNLOCKED' | 'UNLOCKING') {}
    static Locked() { return new VaultState('LOCKED'); }
    isLocked() { return this.value === 'LOCKED'; }
}
```
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

#### Task 2: Define Node Entities, Position, and Interfaces
**Files:**
- Create: `apps/web/src/core/domain/nodes/Node.ts`
- Create: `apps/web/src/core/domain/nodes/Position.ts`
- Create: `apps/web/src/core/domain/nodes/INodeRepository.ts`
- Create: `apps/web/src/core/domain/nodes/INodePresenter.ts`
- Create: `apps/web/src/core/domain/crypto/ICryptoProvider.ts`

- [ ] **Step 1: Define Node abstract class, Chapter/Notebook subclasses.**
- [ ] **Step 2: Define Position Value Object with x, y coordinates.**
- [ ] **Step 3: Define INodeRepository interface (save, findById).**
- [ ] **Step 4: Define INodePresenter interface (presentNodes, presentError).**
- [ ] **Step 5: Define ICryptoProvider interface (encrypt, decrypt, deriveKey).**
- [ ] **Step 6: Commit**

---

### Phase 2: Application Layer (Use Cases)

**Goal:** Implement business logic and lock checks.

#### Task 3: CreateNode Use Case
**Files:**
- Create: `apps/web/src/core/application/nodes/CreateNodeUseCase.ts`
- Test: `apps/web/src/core/application/nodes/CreateNodeUseCase.test.ts`

- [ ] **Step 1: Write a test that fails when the vault is locked.**
- [ ] **Step 2: Implement the lock check in CreateNodeUseCase.**
- [ ] **Step 3: Verify the test passes.**
- [ ] **Step 4: Commit**

#### Task 3b: Sync & Crypto Use Cases
**Files:**
- Create: `apps/web/src/core/application/sync/SyncUseCase.ts`
- Create: `apps/web/src/core/application/vault/UnlockVaultUseCase.ts`

- [ ] **Step 1: Implement SyncUseCase to orchestrate background synchronization.**
- [ ] **Step 2: Implement UnlockVaultUseCase to manage cryptographic key derivation.**
- [ ] **Step 3: Commit**

---

### Phase 3: Infrastructure Layer (Adapters)

**Goal:** Implement the concrete Yjs repository, Nanostore presenter, and Crypto Worker.

#### Task 4: YjsNodeRepository Implementation
**Files:**
- Create: `apps/web/src/core/infrastructure/persistence/YjsNodeRepository.ts`
- Create: `apps/web/src/core/infrastructure/crypto/WebWorkerCryptoProvider.ts`

- [ ] **Step 1: Implement INodeRepository using Yjs.**
- [ ] **Step 2: Implement ICryptoProvider using a Web Worker for off-main-thread AES-GCM.**
- [ ] **Step 3: Commit**

---

### Phase 4: Presentation Layer Migration

**Goal:** Update UI components to use the new architecture.

#### Task 5: Migrate Sidebar to Use Case & Nanostores
**Files:**
- Modify: `apps/web/src/components/Sidebar.tsx` (or equivalent)
- Create: `apps/web/src/core/infrastructure/presenters/NanostoreNodePresenter.ts`

- [ ] **Step 1: Implement NanostoreNodePresenter to update `$nodeTree` via INodePresenter.**
- [ ] **Step 2: Refactor Sidebar to call CreateNodeUseCase.**
- [ ] **Step 3: Verify via Playwright E2E test.**
- [ ] **Step 4: Commit**

---

### Phase 5: Legacy Cleanup

**Goal:** Remove redundant code and finalize the reorganization.

#### Task 6: Remove Legacy Services
**Files:**
- Delete: `apps/web/src/services/SyncService.ts`
- Delete: `apps/web/src/services/SyncManager.ts`
- Delete: `apps/web/src/services/CryptoService.ts`

- [ ] **Step 1: Confirm all references are migrated to the core/application layer.**
- [ ] **Step 2: Remove the files.**
- [ ] **Step 3: Run full test suite and build.**
- [ ] **Step 4: Commit**
