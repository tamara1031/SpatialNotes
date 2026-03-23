# Core Domain & Logic (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor and extend `packages/core` to support the refined Node hierarchy and Command Pattern.

**Architecture:** Domain-Driven Design (DDD) with a polymorphic class hierarchy and Command Pattern for state transitions.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Update Types & Protocol Constants

**Files:**
- Modify: `packages/core/src/domain/types.ts`

- [ ] **Step 1: Update NodeType and NodeRecord**

```typescript
export type NodeType = 
  | 'FOLDER' | 'NOTEBOOK' | 'PAGE' 
  | 'ELEMENT_STROKE' | 'ELEMENT_IMAGE' 
  | 'ELEMENT_TEXT' | 'ELEMENT_TAPE';

export interface NodeRecord {
  id: string;
  parentId: string | null;
  type: NodeType;
  name?: string; // Optional for elements
  metadata: Record<string, any>;
  updatedAt: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/domain/types.ts
git commit -m "feat(core): align NodeType and NodeRecord with protocol spec"
```

---

### Task 2: Implement CanvasCommand and History

**Files:**
- Create: `packages/core/src/domain/CanvasCommand.ts`
- Test: `packages/core/tests/domain/Command.test.ts`

- [ ] **Step 1: Write the failing test for CommandHistory**

```typescript
import { describe, it, expect } from 'vitest';
import { CommandHistory, CanvasCommand } from '../../src/domain/CanvasCommand';

describe('CommandHistory', () => {
  it('should push and pop undo commands', () => {
    const history = new CommandHistory();
    const mockCmd: CanvasCommand = { execute: () => {}, undo: () => {} };
    history.push(mockCmd);
    expect(history.popUndo()).toBe(mockCmd);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter core test`
Expected: FAIL (CanvasCommand not found)

- [ ] **Step 3: Write minimal implementation**

```typescript
export interface CanvasCommand {
  execute(): void;
  undo(): void;
}

export class CommandHistory {
  private undoStack: CanvasCommand[] = [];
  private redoStack: CanvasCommand[] = [];

  push(command: CanvasCommand): void {
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo on new action
  }

  popUndo(): CanvasCommand | undefined {
    return this.undoStack.pop();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/CanvasCommand.ts packages/core/tests/domain/Command.test.ts
git commit -m "feat(core): implement CanvasCommand and CommandHistory stack"
```

---

### Task 3: Refine Node Hierarchy & Validation

**Files:**
- Modify: `packages/core/src/domain/Node.ts`
- Create: `packages/core/src/domain/PageNode.ts`
- Create: `packages/core/src/domain/CanvasElement.ts`
- Test: `packages/core/tests/domain/Node.test.ts`

- [ ] **Step 1: Write circular reference test (SC-U1)**

```typescript
import { describe, it, expect } from 'vitest';
// ... import nodes
describe('Node Hierarchy', () => {
  it('should throw CircularReferenceError when parenting to descendant', () => {
    // ... setup parent -> child
    expect(() => parent.setParent(child)).toThrow();
  });
});
```

- [ ] **Step 2: Implement PageNode and CanvasElement**

```typescript
// PageNode.ts
export class PageNode extends Node {
  // Fixed size logic (ADR-003)
}

// CanvasElement.ts
export abstract class CanvasElement extends Node {
  // Bounding box logic
}
```

- [ ] **Step 3: Run tests and verify SC-U1/U2/U3**

Run: `pnpm --filter core test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/domain/ packages/core/tests/domain/
git commit -m "feat(core): implement PageNode and CanvasElement with hierarchy validation"
```
