# ADR-047: Landing Page & Route Separation

## Status
Accepted

## Context
SpatialNotes currently launches directly into the workspace (NoteView). As we transition to a multi-user, product-ready application, we need a dedicated Landing Page (`/`) to communicate the value proposition, showcase features, and provide clear entry points for Sign-in and Sign-up.

## Decision
1. **Route Separation**:
    - `/`: Landing Page (Astro).
    - `/notes`: Main Workspace (Astro Page hosting the React `DesktopApp`).
2. **Technology**:
    - Use **Astro** for the landing page to ensure maximum performance (Zero-JS by default) and SEO optimization.
    - Use **React + Framer Motion** for the Auth Components to provide a premium experience.
3. **Auth Integration**:
    - The `vaultStore` manages the shared authentication state.
    - **No Auto-Redirect from Root**: Even if authenticated, users stay on the landing page at `/`. A "Go to Notes" button is displayed in the UI (Navbar/Hero) to allow manual transition to `/notes`.
    - Access to `/notes` is protected and requires a valid session; otherwise, users are redirected to `/signin`.

## Consequences
- Improving SEO and first-load performance for guests.
- Clearer separation of marketing content and application logic.
- Users have control over when they enter the application from the landing page.
- requires consistent session verification on the `/notes` route.
