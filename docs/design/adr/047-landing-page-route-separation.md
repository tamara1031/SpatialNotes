# ADR-047: Landing Page & Route Separation

## Status
Proposed

## Context
SpatialNotes currently launches directly into the workspace (NoteView). As we transition to a multi-user, product-ready application, we need a dedicated Landing Page (`/`) to communicate the value proposition, showcase features, and provide clear entry points for Sign-in and Sign-up.

## Decision
1. **Route Separation**:
    - `/`: Landing Page (Astro).
    - `/vault`: Main Workspace (Astro Page hosting the React `DesktopApp`).
2. **Technology**:
    - Use **Astro** for the landing page to ensure maximum performance (Zero-JS by default) and SEO optimization.
    - Use **React + Framer Motion** for the Auth Modals to provide a premium, smooth transition experience (Glassmorphism).
3. **Auth Integration**:
    - The `vaultStore` will manage the shared authentication state and modal visibility.
    - Redirect logic will be handled at the page level or within the store initialization.

## Consequences
- Improving SEO and first-load performance for guests.
- Clearer separation of marketing content and application logic.
- Requires careful handling of "Checking Vault Status" to avoid unintended redirects while browsing the landing page.
