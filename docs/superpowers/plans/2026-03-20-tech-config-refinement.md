# Tech Stack and Configuration Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize canvas-engine and enforce architectural rules for Command Pattern and ADR-014.

**Architecture:** Standardized monorepo package setup and rule-based governance updates.

**Tech Stack:** TypeScript, pnpm, Markdown.

---

### Task 1: Initialize canvas-engine package

**Files:**
- Create: `packages/canvas-engine/package.json`
- Create: `packages/canvas-engine/tsconfig.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "canvas-engine",
  "version": "1.0.0",
  "description": "SpatialNotes rendering and ink math logic",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "packageManager": "pnpm@10.17.0",
  "devDependencies": {
    "@types/node": "^25.5.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../core/tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create src/index.ts (entry point)**

```typescript
export const version = '1.0.0';
```

- [ ] **Step 4: Verify with pnpm install**

Run: `pnpm install --silent`
Expected: Success, lockfile updated.

- [ ] **Step 5: Commit**

```bash
git add packages/canvas-engine/
git commit -m "feat(canvas-engine): initialize package with TS/Vitest config"
```

---

### Task 2: Update TypeScript Shared Rules

**Files:**
- Modify: `.agent/rules/typescript-shared.md`

- [ ] **Step 1: Add Command Pattern section**

```markdown
## Command Pattern for Undo/Redo
All user operations that modify the canvas state MUST:
1.  Implement the `CanvasCommand` interface (`execute()`, `undo()`).
2.  Be processed via the `CommandHistory` stack to ensure local consistency.
3.  Use the `ELEMENT_` prefix for protocol-related type constants.
```

- [ ] **Step 2: Commit**

```bash
git add .agent/rules/typescript-shared.md
git commit -m "chore(rules): add Command Pattern enforcement to TS standards"
```

---

### Task 3: Update Project Standards with ADR-014

**Files:**
- Modify: `.agent/rules/project-standards.md`

- [ ] **Step 1: Add ADR-014 section**

```markdown
## Concurrency & Undo Strategy (ADR-014)
- **Local Undo Only**: Device A's undo stack is independent of Device B.
- **MVP Limits**: 
    - Max 50 pages / 500 elements per page.
    - Performance warnings MUST be triggered in the UI when exceeding these limits.
- **Yjs CRDT**: Use standard LWW (Last Write Wins) registers for hierarchical metadata.
```

- [ ] **Step 2: Commit**

```bash
git add .agent/rules/project-standards.md
git commit -m "chore(rules): integrate ADR-014 into project standards"
```
