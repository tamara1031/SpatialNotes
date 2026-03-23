# E2EE Architecture Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement End-to-End Encryption (E2EE) using a Dual-Key Strategy, Incremental Yjs Updates, and Web Workers to ensure user privacy and sub-16ms latency.

**Architecture:** Use `PBKDF2` for Key Derivation and `AES-GCM` for authenticated encryption. Cryptographic operations are offloaded to a `CryptoWorker` to keep the UI thread responsive. The `VaultManager` acts as the domain controller for the unlocked state.

**Tech Stack:** TypeScript, Web Crypto API (SubtleCrypto), Vitest, Yjs.

---

## File Structure

### Core Domain (Logic)
- Create: `packages/core/src/domain/crypto/VaultManager.ts` - Manages Vault state, Master Key, and Authentication Hash.
- Create: `packages/core/src/domain/crypto/types.ts` - Common crypto interfaces and enums.
- Create: `packages/core/src/domain/crypto/CryptoService.ts` - Domain service for high-level encrypt/decrypt logic.

### Infrastructure (Implementation)
- Create: `packages/core/src/infrastructure/crypto/CryptoWorkerProxy.ts` - Proxy for communicating with the Web Worker.
- Create: `packages/core/src/infrastructure/crypto/CryptoWorker.ts` - The actual Web Worker implementation using `SubtleCrypto`.

### Tests
- Create: `packages/core/tests/domain/crypto/VaultManager.test.ts`
- Create: `packages/core/tests/domain/crypto/CryptoService.test.ts`
- Create: `packages/core/tests/infrastructure/crypto/CryptoWorkerProxy.test.ts`

---

## Task 1: Domain Crypto Types & VaultManager

- [ ] **Step 1: Define common crypto types**
Create `packages/core/src/domain/crypto/types.ts`:
```typescript
export interface CryptoPayload {
  data: Uint8Array;
  iv: Uint8Array;
}

export interface VaultState {
  isLocked: boolean;
  userSalt?: Uint8Array;
}
```

- [ ] **Step 2: Write failing test for VaultManager**
Create `packages/core/tests/domain/crypto/VaultManager.test.ts`. 
**Requirement**: Verify that the derived `VaultKey` is `extractable: false`.

- [ ] **Step 3: Implement VaultManager with PBKDF2**
Create `packages/core/src/domain/crypto/VaultManager.ts`. Use `crypto.subtle.importKey` and `deriveKey`.

- [ ] **Step 4: Run tests and verify**
Run: `pnpm --filter core test VaultManager`

---

## Task 2: CryptoWorker (Web Worker Scaffold)

- [ ] **Step 1: Create CryptoWorker Scaffold**
Create `packages/core/src/infrastructure/crypto/CryptoWorker.ts`. Implement a simple `ping/pong` message handler first.

- [ ] **Step 2: Implement Key Derivation in Worker**
Implement the `DERIVE_KEYS` handler using `PBKDF2`. Ensure the raw password is cleared from scope immediately after derivation.

- [ ] **Step 3: Implement Encrypt/Decrypt in Worker**
Implement `ENCRYPT` and `DECRYPT` using `AES-GCM`. 
**Requirement**: Use **Transferable Objects** for `Uint8Array` buffers to optimize performance.

---

## Task 3: CryptoWorkerProxy & Integration

- [ ] **Step 1: Create CryptoWorkerProxy**
Create `packages/core/src/infrastructure/crypto/CryptoWorkerProxy.ts`. Wrap `worker.postMessage` in Promises.

- [ ] **Step 2: Write Integration Test for Proxy**
Create `packages/core/tests/infrastructure/crypto/CryptoWorkerProxy.test.ts`. Mock the global `Worker` and verify that `deriveKeys` and `encrypt` work as expected.

---

## Task 4: CryptoService & Domain Integration

- [ ] **Step 1: Create CryptoService**
Create `packages/core/src/domain/crypto/CryptoService.ts`. This service coordinates `VaultManager` and `CryptoWorkerProxy`.

- [ ] **Step 2: Write failing test for CryptoService**
Verify that `encryptDelta` returns an opaque blob and `decryptDelta` restores it.

- [ ] **Step 3: Implement CryptoService**
Ensure it correctly handles the "Locked" state (throws error if key is missing).

- [ ] **Step 4: Run all core tests**
Run: `pnpm --filter core test`

---

## Task 5: Final Verification & Quality Gate

- [ ] **Step 1: Security Audit**
Verify that no `CryptoKey` or plaintext password is logged or stored. Confirm `extractable: false` on all keys.

- [ ] **Step 2: Run Lint and Format**
Run: `pnpm run lint && pnpm run format:check`
