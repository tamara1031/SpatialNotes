# Phase 1: Critical Bug Fixes & CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `/` to `/vault` redirect loop, rename `/vault` to `/notes`, and establish a robust CI/CD pipeline.

**Architecture:** Client-side route protection using `AuthGuard` and Astro's static/dynamic route separation. GitHub Actions for automated quality gates and container deployment.

**Tech Stack:** Astro, React, TypeScript, GitHub Actions, Docker.

---

### Task 1: Rename `/vault` to `/notes`

**Files:**
- Rename: `apps/web/src/pages/vault.astro` -> `apps/web/src/pages/notes.astro`
- Modify: `apps/web/src/utils/AuthGuard.ts`
- Modify: `apps/web/src/components/landing/Hero.astro`
- Modify: `apps/web/src/components/landing/Navbar.astro`
- Modify: `apps/web/src/pages/signin.astro`
- Modify: `apps/web/src/pages/signup.astro`
- Test: `tests/e2e/golden-path.spec.ts`

- [ ] **Step 1: Rename the page file**
    ```bash
    mv apps/web/src/pages/vault.astro apps/web/src/pages/notes.astro
    ```

- [ ] **Step 2: Update AuthGuard logic**
    Modify `apps/web/src/utils/AuthGuard.ts`:
    ```typescript
    // Replace isVaultPage with isNotesPage
    const isNotesPage = path.includes("/notes");
    
    // Update redirect in mode === "public"
    if (hasToken && isAuthPage) {
        window.location.href = "/notes/";
    }
    ```

- [ ] **Step 3: Update links in Landing Page components**
    Update `Hero.astro` and `Navbar.astro` to point to `/notes/`.

- [ ] **Step 4: Update redirect in Signin/Signup pages**
    Update `onSuccess` callback in `signin.astro` and `signup.astro`.

- [ ] **Step 5: Update E2E test references**
    Update `tests/e2e/golden-path.spec.ts` to expect `/notes/`.

- [ ] **Step 6: Verify with E2E tests**
    Run: `pnpm test:e2e`
    Expected: PASS

- [ ] **Step 7: Commit**
    ```bash
    git add .
    git commit -m "refactor: rename /vault to /notes and update references"
    ```

### Task 2: Fix Redirect Loop in `AuthGuard.ts`

**Files:**
- Modify: `apps/web/src/utils/AuthGuard.ts`
- Modify: `apps/web/src/components/DesktopApp.tsx`

- [ ] **Step 1: Refine `enforceAuthStatus`**
    Ensure `/` never redirects to `/notes/` automatically.
    ```typescript
    if (mode === "public") {
        if (hasToken && isAuthPage) {
            window.location.href = "/notes/";
        }
        // Explicitly NO redirect from isRoot
    }
    ```

- [ ] **Step 2: Relax `DesktopApp.tsx` redirect**
    Wait for full initialization before redirecting back to `/`.
    ```tsx
    useEffect(() => {
        if (isInitialized && (appState === "email" || appState === "setup")) {
            // Check if we REALLY don't have a token before kicking out
            const token = localStorage.getItem("session_token");
            if (!token) {
                window.location.href = "/";
            }
        }
    }, [isInitialized, appState]);
    ```

- [ ] **Step 3: Manual Verification**
    Verify no redirect loop occurs when visiting `/` or `/notes/` in various auth states.

- [ ] **Step 4: Commit**
    ```bash
    git add apps/web/src/utils/AuthGuard.ts apps/web/src/components/DesktopApp.tsx
    git commit -m "fix: resolve redirect loop and refine auth guard logic"
    ```

### Task 3: Establish CI/CD Pipeline

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Update CI workflow triggers and jobs**
    ```yaml
    on:
      push:
        branches: [ master ]
        tags: [ 'v*' ]
      pull_request:
        branches: [ master ]

    jobs:
      test:
        # Run lint, unit tests, and e2e
      deploy-edge:
        if: github.ref == 'refs/heads/master'
        # Build and push to Docker Hub with :edge and :sha-<hash>
      deploy-release:
        if: startsWith(github.ref, 'refs/tags/v')
        # Build and push to Docker Hub with :<version> and :latest
    ```

- [ ] **Step 2: Verify workflow syntax**
    ```bash
    # (Manual check of yaml structure)
    ```

- [ ] **Step 3: Commit**
    ```bash
    git add .github/workflows/ci.yml
    git commit -m "ci: establish robust pipeline for quality gates and deployment"
    ```
