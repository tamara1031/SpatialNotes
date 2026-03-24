# Phase 4: Frontend Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modularize frontend and optimize for pen tablets.

**Architecture:** Astro Islands, React components.

**Tech Stack:** Astro, React, Framer Motion, CSS Variables.

---

### Task 1: Audit and Refactor Astro Components

**Files:**
- Modify: `apps/web/src/pages/index.astro`
- Create: `apps/web/src/components/landing/Section.astro`
- Create: `apps/web/src/components/landing/FeatureCard.astro`

- [ ] **Step 1: Extract `Section` component**
    Abstract common landing page section styles and structure.

- [ ] **Step 2: Extract `FeatureCard` component**
    Simplify the features list using a reusable component.

- [ ] **Step 3: Commit**
    ```bash
    git add apps/web/src/components/landing/
    git commit -m "feat: modularize landing page components with Astro"
    ```

### Task 2: Implement Encryption Level UI

**Files:**
- Create: `apps/web/src/components/shared/EncryptionBadge.tsx`
- Modify: `apps/web/src/components/sidebar/NewNoteButton.tsx`

- [ ] **Step 1: Create `EncryptionBadge`**
    A small, informative badge for Standard vs. E2EE notes.

- [ ] **Step 2: Update "New Note" flow**
    Allow users to select encryption level on creation.

- [ ] **Step 3: Commit**
    ```bash
    git add .
    git commit -m "feat: add encryption level indicators to UI"
    ```

### Task 3: Optimize Pen Interaction

**Files:**
- Modify: `packages/canvas-engine/src/interaction/InteractionManager.ts`

- [ ] **Step 1: Improve touch/pen distinction**
    Prevent accidental palm touches from triggering drawing or pan.

- [ ] **Step 2: Add support for stylus pressure**
    Reflect pressure in stroke width using Wasm core.

- [ ] **Step 3: Commit**
    ```bash
    git add packages/canvas-engine/
    git commit -m "perf: optimize canvas interaction for pen tablets"
    ```
