# Test Specification: Astro Auth Flow

## Overview
This document specifies the testing requirements for the Astro-driven landing and authentication flow, focusing on performance, correctness of redirection, and state management.

## 1. Behavioral Tests (End-to-End)
These tests ensure the user experience is consistent across different entry points.

### Scenario 1: Guest Accessing Root
- **Precondition**: `localStorage` is empty.
- **Action**: Navigate to `/`.
- **Expected Result**: 
    - Landing page is displayed.
    - No redirection occurs.
    - Performance: Minimal JS loaded.

### Scenario 2: Authenticated User Accessing Root
- **Precondition**: `localStorage` contains a valid `session_token`.
- **Action**: Navigate to `/`.
- **Expected Result**:
    - Immediate redirection to `/vault/`.
    - URL reflects the trailing slash.

### Scenario 3: Deep Link to Auth Pages
- **Action**: Navigate directly to `/signin/` or `/signup/`.
- **Expected Result**:
    - Correct auth page is displayed.
    - Back button points to `/`.

### Scenario 4: Successful Sign-in
- **Action**: Enter valid credentials on `/signin/`.
- **Expected Result**:
    - `session_token` is stored in `localStorage`.
    - User is redirected to `/vault/`.

## 2. White-box Tests (Unit/Integration)
These tests verify individual logic blocks within components and stores.

### checkVaultStatus Logic (`vaultStore.ts`)
- **Test**: It should set `$appState` to `locked` if `last_user` exists.
- **Test**: It should set `$appState` to `email` if `last_user` is missing.

### identifyUser Error Handling (`auth.actions.ts`)
- **Test**: It should handle gateway errors gracefully without crashing the initialization flow.

### Sync Initialization (`vaultStore.ts`)
- **Test**: `syncInitialNodes` should populate the `nodesMap` after login.
