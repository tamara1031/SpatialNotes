# Astro + Rust/Wasm Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the frontend from React/Vite to Astro and integrate a Rust/Wasm-based ink engine for high-performance canvas math.

**Architecture:** Astro manages the UI shell (Island Architecture) and layout. Rust/Wasm handles the core mathematical computations for the ink engine (smoothing, pressure). Go remains the backend for persistence and synchronization.

**Tech Stack:** Astro, TypeScript, Rust (wasm-pack), Go.

---

### Task 1: Architectural Documentation Update

**Files:**
- Create: `docs/design/adr/020-astro-wasm-island-architecture.md`
- Modify: `docs/design/README.md`
- Modify: `docs/design/0-requirements/architecture-overview.md`
- Modify: `.agent/rules/project-standards.md`
- Modify: `.agent/rules/react-frontend.md` (Rename or replace with `astro-frontend.md`)

- [ ] **Step 1: Create ADR-020**
    - Context: Need for performance in ink rendering.
    - Decision: Astro + Wasm + Go.
    - Roles: Go (Backend), Astro (Frontend/UI), Rust (Engine/Wasm).
- [ ] **Step 2: Update Architecture Overview**
    - Update the tech stack table.
    - Update the "Unified Domain Logic" section to include Wasm.
- [ ] **Step 3: Update Design README**
    - Add reference to ADR-020.
- [ ] **Step 4: Update Project Standards**
    - Document the "3-Layer Stack" roles.

### Task 2: Initialize Rust/Wasm Package

**Files:**
- Create: `packages/canvas-wasm/Cargo.toml`
- Create: `packages/canvas-wasm/src/lib.rs`
- Modify: `package.json` (root)
- Modify: `Makefile`

- [ ] **Step 1: Create `packages/canvas-wasm/Cargo.toml`**
- [ ] **Step 2: Create a minimal `lib.rs` with a sample Wasm function**
- [ ] **Step 3: Update root `package.json` to include Wasm build scripts**
- [ ] **Step 4: Update `Makefile` to include Wasm compilation using `wasm-pack`**

### Task 3: Migrate apps/web to Astro

**Files:**
- Create: `apps/web/astro.config.mjs`
- Create: `apps/web/src/pages/index.astro`
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/App.tsx` (Convert or wrap as an Island)

- [ ] **Step 1: Install Astro and required integrations (React, TypeScript)**
- [ ] **Step 2: Initialize `astro.config.mjs`**
- [ ] **Step 3: Create the main page in Astro**
- [ ] **Step 4: Port existing React components to be used as Islands**

### Task 4: Integrate Wasm into Canvas Engine

**Files:**
- Modify: `packages/canvas-engine/src/index.ts`
- Modify: `packages/canvas-engine/package.json`

- [ ] **Step 1: Add `canvas-wasm` dependency to `canvas-engine`**
- [ ] **Step 2: Implement Wasm initialization in `canvas-engine`**
- [ ] **Step 3: Replace TypeScript-based smoothing logic with Rust-based Wasm calls**

### Task 5: Final Validation and Cleanup

- [ ] **Step 1: Run full build (`make build`)**
- [ ] **Step 2: Run tests (`make test`)**
- [ ] **Step 3: Cleanup redundant Vite configuration files if any**
- [ ] **Step 4: Final commit**
