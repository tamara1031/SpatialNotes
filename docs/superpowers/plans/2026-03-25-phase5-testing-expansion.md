# Phase 5: Testing Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full-journey E2E and boost unit coverage.

**Architecture:** Playwright (E2E), Vitest (Unit).

**Tech Stack:** Playwright, Vitest, Go testing.

---

### Task 1: Clean-DB E2E Test

**Files:**
- Create: `tests/e2e/full-journey.spec.ts`
- Modify: `seed_db_playwright.sh`

- [ ] **Step 1: Implement database reset script**
    Ensure a clean state before each E2E run.

- [ ] **Step 2: Write "Full Journey" test**
    Cover registration, vault setup, and multi-note lifecycle.

- [ ] **Step 3: Run E2E tests**
    Run: `pnpm test:e2e`
    Expected: PASS

- [ ] **Step 4: Commit**
    ```bash
    git add tests/e2e/ seed_db_playwright.sh
    git commit -m "test: add comprehensive clean-db full-journey E2E test"
    ```

### Task 2: Unit Test Edge Cases

**Files:**
- Modify: `apps/web/tests/store/vaultStore.test.ts`
- Modify: `apps/server/internal/service/auth_service_test.go`

- [ ] **Step 1: Test invalid master password**
    Verify correct error handling and session termination.

- [ ] **Step 2: Test sync conflicts**
    Simulate offline edits and verify Yjs resolution.

- [ ] **Step 3: Commit**
    ```bash
    git add .
    git commit -m "test: boost unit test coverage for critical domain logic edge cases"
    ```

### Task 3: JSDoc/GoDoc Generation

**Files:**
- Modify: Public interfaces in `packages/core` and `apps/server`

- [ ] **Step 1: Add documentation comments**
    Use standard JSDoc/GoDoc format for all public exports.

- [ ] **Step 2: Verify documentation**
    Run: `go doc` and check IDE hovers.

- [ ] **Step 3: Commit**
    ```bash
    git add .
    git commit -m "docs: generate standardized JSDoc and GoDoc for public APIs"
    ```
