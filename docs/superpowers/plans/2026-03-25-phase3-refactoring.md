# Phase 3: Large-Scale Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce SOLID/DDD, optimize structure, and eliminate redundancy.

**Architecture:** Domain-Driven Design (DDD), Modular Engine Architecture (ADR-024).

**Tech Stack:** Go, TypeScript, Vitest.

---

### Task 1: Refine Core Engine Registry

**Files:**
- Modify: `packages/core/src/registry/EngineRegistry.ts`
- Modify: `apps/web/src/components/NoteViewShell.tsx`

- [ ] **Step 1: Define Engine Interface**
    Ensure a unified interface for all engines (Canvas, Markdown).

- [ ] **Step 2: Update Registry logic**
    Allow dynamic registration and resolution of engines.

- [ ] **Step 3: Update `NoteViewShell`**
    Remove hardcoded engine switches, use the registry to resolve the correct component.

- [ ] **Step 4: Commit**
    ```bash
    git add .
    git commit -m "refactor: decouple engines using unified registry pattern"
    ```

### Task 2: Abstract Command Storage (ADR-049)

**Files:**
- Create: `packages/core/src/ports/ICommandStore.ts`
- Modify: `packages/core/src/domain/Note.ts`

- [ ] **Step 1: Define `ICommandStore` interface**
    Abstract the storage of individual commands (strokes, edits).

- [ ] **Step 2: Inject into note entity**
    Ensure notes are storage-agnostic.

- [ ] **Step 3: Commit**
    ```bash
    git add packages/core/
    git commit -m "feat: abstract command storage for engine plugability"
    ```

### Task 3: Dependency Audit & Clean Up

**Files:**
- Modify: `package.json`, `go.mod`
- Remove: Orphaned/Unused files identified in research.

- [ ] **Step 1: Audit dependencies**
    Run `pnpm audit` and update versions.

- [ ] **Step 2: Remove dead code**
    Search for unused exports and components.

- [ ] **Step 3: Commit**
    ```bash
    git add .
    git commit -m "chore: clean up dead code and update dependencies"
    ```
