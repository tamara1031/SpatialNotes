# Test Implementation (Phase B: Sync & Protocol) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement quality gates for real-time synchronization and collaborative state management.

**Architecture:** Integration tests simulating multi-client synchronization using Yjs and mock message buses.

**Tech Stack:** TypeScript, Vitest, Yjs.

---

### Task 1: Yjs Binary Merge & Convergence (SC-I3)

**Files:**
- Create: `apps/web/tests/sync/YjsIntegrity.test.ts`

- [ ] **Step 1: Write failing test for multi-client convergence**

```typescript
import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

describe('Yjs Convergence', () => {
  it('should reach identical state after concurrent updates', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    // ... concurrent map updates
    // ... cross-apply updates
    expect(docA.getMap('elements').toJSON()).toEqual(docB.getMap('elements').toJSON());
  });
});
```

- [ ] **Step 2: Run test to verify it fails (or passes if CRDT logic is already sound)**

Run: `pnpm --filter web test`

- [ ] **Step 3: Refine test with complex nested updates**

- [ ] **Step 4: Commit**

```bash
git add apps/web/tests/sync/YjsIntegrity.test.ts
git commit -m "test(web): implement Yjs binary merge and convergence tests (SC-I3)"
```

---

### Task 2: Collaborative Move Behavioral Test (SC-S1)

**Files:**
- Create: `apps/web/tests/sync/CollaborativeMove.test.ts`

- [ ] **Step 1: Write behavioral test for node relocation**

```typescript
it('should reflect node move from Client A on Client B', () => {
  // 1. Setup Client A and B linked by mock bus
  // 2. Client A: node.setParent(newFolder)
  // 3. Verify Client B: node.parentId is newFolder.id
});
```

- [ ] **Step 2: Run test to verify it fails correctly**

- [ ] **Step 3: Implement necessary sync glue logic in useSync hook (if missing)**

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add apps/web/tests/sync/CollaborativeMove.test.ts
git commit -m "test(web): implement collaborative move behavioral test (SC-S1)"
```
