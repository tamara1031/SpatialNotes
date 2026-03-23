# Frontend & Real-time Sync (Phase 3) Implementation Plan (OBSOLETE)

> [!WARNING]
> The WebSocket synchronization portion of this plan is OBSOLETE for the MVP. The system now uses local-first persistence with optional REST materialization.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the React frontend with Yjs synchronization and Command Pattern UI binding.

**Architecture:** Component-based UI with custom hooks for state management and real-time sync.

**Tech Stack:** React, Vite, Framer Motion, Yjs, Vitest.

---

### Task 1: Setup Frontend Structure and Design Tokens

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/src/styles/tokens.css`

- [ ] **Step 1: Initialize apps/web package.json**

```json
{
  "name": "web",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "framer-motion": "^12.0.0",
    "yjs": "^13.6.0",
    "y-websocket": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: Add Design Tokens**

```css
:root {
  --surface: hsl(210, 15%, 8%);
  --accent: hsl(200, 100%, 65%);
  --blur: 12px;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/
git commit -m "feat(web): initialize apps/web structure and design tokens"
```

---

### Task 2: Implement useSync Hook (Yjs Integration)

**Files:**
- Create: `apps/web/src/hooks/useSync.ts`
- Test: `apps/web/tests/hooks/useSync.test.ts`

- [ ] **Step 1: Write sync integration test (SC-S1)**

```typescript
import { describe, it, expect } from 'vitest';
// ... test Y.Doc merge logic
```

- [ ] **Step 2: Implement useSync hook**

```typescript
export const useSync = (roomId: string) => {
  const ydoc = useMemo(() => new Y.Doc(), []);
  // ... provider setup
  return { ydoc };
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/ apps/web/tests/
git commit -m "feat(web): implement useSync hook for Yjs WebSocket integration"
```

---

### Task 3: Build CanvasInteractionView and Command Binding

**Files:**
- Create: `apps/web/src/components/canvas/CanvasInteractionView.tsx`
- Create: `apps/web/src/context/CommandContext.tsx`

- [ ] **Step 1: Implement CommandContext for Undo/Redo UI**

```typescript
export const CommandProvider = ({ children }) => {
  const history = useMemo(() => new CommandHistory(), []);
  // ... keyboard handler for Ctrl+Z
}
```

- [ ] **Step 2: Build CanvasInteractionView with basic drawing**

```typescript
export const CanvasInteractionView = () => {
  // ... handle onPointerDown/Move/Up
  // ... trigger CreateElementCommand
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ apps/web/src/context/
git commit -m "feat(web): implement CanvasInteractionView and Command UI binding"
```
