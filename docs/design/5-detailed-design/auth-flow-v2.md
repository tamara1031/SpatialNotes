# Authentication Flow V2 Design

This document details the reorganized authentication flow, ensuring a robust separation between static Astro pages and the dynamic React-driven Vault.

## Diagrams

- **Robustness**: [UC17-19 Auth Robustness](../3-robustness/uc17-landing-page.puml)
- **Sequence (Sign In)**: [auth-signin-sequence.puml](./auth-signin-sequence.puml)
- **Sequence (Login Success)**: [auth-login-success-sequence.puml](./auth-login-success-sequence.puml)
- **Class Diagram**: [auth-class-diagram.puml](./auth-class-diagram.puml)

## Implementation Strategy

1.  **Refactor `index.astro`**: Ensure the redirect guard is laser-focused and doesn't interfere with other pages.
2.  **Refactor `vault.astro`**: Ensure it ONLY renders when the URL is `/vault/` and handles its own auth check gracefully.
3.  **Refactor `DesktopApp.tsx`**: Add a more robust "initialization" state that prevents jumping back to landing page.
4.  **Simplify Routing**: Avoid complex Astro configuration if possible; stick to standard file-based routing and simple location redirects.
