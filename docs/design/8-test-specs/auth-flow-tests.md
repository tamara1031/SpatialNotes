# TS4: Auth Flow & Landing Page

## 1. Overview
Verify the landing page presentation and the authentication flow (Sign-in/Sign-up) including E2EE vault initialization.

## 2. Test Cases

### 2.0 Initial Landing Page State
- **Objective**: Ensure NO auth modal is shown on initial visit for guest.
- **Steps**:
    1. Clear localStorage and cookies.
    2. Navigate to `/`.
    3. Verify that the Auth Modal overlay is NOT visible and does not block interactions.
- **Expectation**: Landing page is fully visible and interactive.

### 2.1 Landing Page Presentation (Manual/Visual)
- **Objective**: Ensure the design follows ADR-037.
- **Steps**:
    1. Navigate to `/`.
    2. Verify Hero section, feature grid, and footer.
    3. Check mobile responsiveness (breakpoint 768px).
- **Expectation**: Premium Glassmorphism look, Outfit font, smooth scroll.

### 2.2 Auth Modal Visibility (Automated - Playwright)
- **Objective**: Verify modals trigger correctly.
- **Steps**:
    1. Click "Sign Up" button in Hero.
    2. Verify modal appears with "Create Account" title.
    3. Close modal.
    4. Click "Sign In" button in Header.
    5. Verify modal appears with "Welcome Back" title.

### 2.3 Registration Flow (Automated - Playwright)
- **Objective**: Verify end-to-end registration.
- **Steps**:
    1. Fill registration form with new email/password.
    2. Click "Register".
    3. Verify redirection to `/vault`.
    4. Verify user can create a new node in the workspace.

### 2.4 Login Flow (Automated - Playwright)
- **Objective**: Verify returning user login.
- **Steps**:
    1. Registration first (to ensure user exists).
    2. Go back to `/`.
    3. Click "Sign In".
    4. Fill credentials.
    5. Verify redirection and data persistence.

## 3. Tooling
- **Frontend**: Vitest for store transitions.
- **E2E**: Playwright for cross-window and flow verification.
