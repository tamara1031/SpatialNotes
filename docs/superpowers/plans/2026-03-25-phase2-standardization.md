# Phase 2: Design Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize design documentation and unify domain models.

**Architecture:** ICONIX-inspired design flow.

**Tech Stack:** Markdown, PlantUML.

---

### Task 1: Reorganize Design Docs

**Files:**
- Modify: `docs/design/README.md`
- Move: Miscellaneous docs to appropriate folders in `docs/design/`

- [ ] **Step 1: Create a central index in `README.md`**
    ```markdown
    # Design Documentation Index
    - [Requirements](./0-requirements/README.md)
    - [Domain Models](./1-domain/README.md)
    - [Use Cases](./2-use-cases/README.md)
    - [Robustness Diagrams](./3-robustness/README.md)
    - [Detailed Design](./5-detailed-design/README.md)
    ```

- [ ] **Step 2: Commit**
    ```bash
    git add docs/design/
    git commit -m "docs: reorganize design documentation structure"
    ```

### Task 2: Create Detailed Design Docs

**Files:**
- Create: `docs/design/5-detailed-design/canvas-engine.md`
- Create: `docs/design/5-detailed-design/markdown-engine.md`
- Create: `docs/design/5-detailed-design/auth-e2ee.md`
- Create: `docs/design/5-detailed-design/sync-persistence.md`

- [ ] **Step 1: Document `Canvas Engine`**
    Describe spatial hashing, stroke lifecycles, and Wasm interaction.

- [ ] **Step 2: Document `Markdown Engine`**
    Describe WYSIWYG, KaTeX, and Yjs integration.

- [ ] **Step 3: Document `Auth & E2EE`**
    Describe Argon2 hashing, AES-GCM encryption, and vault state transitions.

- [ ] **Step 4: Document `Sync & Persistence`**
    Describe Yjs updates, IndexedDB, and server-side storage.

- [ ] **Step 5: Commit**
    ```bash
    git add docs/design/5-detailed-design/
    git commit -m "docs: add detailed design specifications for core domains"
    ```
