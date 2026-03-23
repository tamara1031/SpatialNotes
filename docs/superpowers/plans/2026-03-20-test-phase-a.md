# Test Implementation (Phase A: Domain Extensions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement missing quality gates for NodeFactory and Visitor Pattern in `packages/core`.

**Architecture:** TDD-driven implementation of polymorphic mapping and tree traversal logic.

**Tech Stack:** TypeScript, Vitest.

---

### Task 0: EngineInterface Verification (Shared)

**Files:**
- Create: `packages/engine-core/tests/EngineInterface.test.ts`

- [ ] **Step 1: Write white-box test for EngineInterface generics**
- [ ] **Step 2: Run test in engine-core**
- [ ] **Step 3: Verify all canvas-engine tests resolve engine-core**

### Task 1: NodeFactory Polymorphism (SC-U4/U5)

**Files:**
- Create: `packages/core/src/domain/NodeFactory.ts`
- Create: `packages/core/tests/domain/NodeFactory.test.ts`

- [ ] **Step 1: Write failing test for type mapping (SC-U4)**

```typescript
import { describe, it, expect } from 'vitest';
import { NodeFactory } from '../../src/domain/NodeFactory';
import { Folder } from '../../src/domain/Folder';

describe('NodeFactory', () => {
  it('should return a Folder instance for type FOLDER', () => {
    const record = { id: '1', type: 'FOLDER', name: 'Test', metadata: {}, updatedAt: Date.now() };
    const node = NodeFactory.create(record);
    expect(node).toBeInstanceOf(Folder);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter core test`
Expected: FAIL (NodeFactory not found)

- [ ] **Step 3: Implement NodeFactory**

```typescript
export class NodeFactory {
  static create(record: NodeRecord): Node {
    switch (record.type) {
      case 'FOLDER': return new Folder(record);
      // ... handle other types
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/NodeFactory.ts packages/core/tests/domain/NodeFactory.test.ts
git commit -m "test(core): implement NodeFactory polymorphism and SC-U4/U5 tests"
```

---

### Task 2: Visitor Pattern Traversal (SC-U6)

**Files:**
- Modify: `packages/core/src/domain/Node.ts`
- Modify: `packages/core/src/domain/PageNode.ts`
- Create: `packages/core/tests/domain/Visitor.test.ts`

- [ ] **Step 1: Write failing test for traversal (SC-U6)**

```typescript
it('should visit all nodes in a page tree', () => {
  const page = new PageNode(...);
  const mockVisitor = { visit: vi.fn() };
  page.accept(mockVisitor);
  expect(mockVisitor.visit).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter core test`
Expected: FAIL (accept not defined)

- [ ] **Step 3: Implement Visitor pattern logic**

```typescript
// Node.ts
abstract accept(visitor: any): void;

// PageNode.ts
accept(visitor: any): void {
  visitor.visit(this);
  this.elements.forEach(e => e.accept(visitor));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/ packages/core/tests/domain/
git commit -m "test(core): implement Visitor pattern traversal and SC-U6 test"
```
