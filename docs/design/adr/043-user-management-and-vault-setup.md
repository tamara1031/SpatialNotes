# ADR-043: Single-User Management and Server-Side Vault Setup

## Status
Accepted

## Context
In the original E2EE architecture (ADR-039), the user salt for key derivation was generated randomly on the first launch and stored exclusively in the local IndexedDB. This created a critical usability and reliability issue: if a user clears their browser storage or attempts to log in from a new device, the salt is lost, making it mathematically impossible to derive the correct Master Key, leading to permanent data loss. 

Additionally, SpatialNotes is fundamentally designed as a "Single-user Multi-engine Architecture" (ADR-030). The lack of an explicit User registration flow caused the system to ask for a Master Password on boot without knowing if a vault had actually been initialized.

## Decision
We introduce a lightweight Server-Side User Management system tailored for a Single-User (or Single-Tenant) deployment model, accompanied by an explicit Vault Setup flow.

### 1. User Entity & Server-Side Salt Storage
- We will add a `users` table to the backend database.
- The `users` table will store the `username` (e.g., "admin"), the generated `salt` (in plain text, base64 encoded), and an `auth_hash` (the secondary hash of the password used for server authentication).
- **Security Implication**: Storing the salt on the server is standard practice and does not compromise the E2EE model, as the server still never sees the Master Password or the Master Key. The salt is only one half of the key derivation input.

### 2. Vault Initialization (First-Run Flow)
- On boot, the client queries the server (`GET /api/auth/status`).
- If no user exists (`initialized: false`), the UI presents a **Setup Vault** screen.
- The client generates a secure random 32-byte salt, derives the necessary keys, and POSTs the `salt` and `auth_hash` to the server to initialize the vault.

### 3. Vault Unlocking (Subsequent Runs)
- If the server reports `initialized: true`, it also returns the `salt`.
- The client UI presents an **Unlock Vault** screen.
- The client uses the fetched `salt` combined with the user's inputted Master Password to derive the Master Key, Auth Hash, and Vault Encryption Key.
- The client verifies the Auth Hash with the server to obtain a JWT session token.

### 4. Deprecation of Backend Canvas Parsing
- To adhere to ADR-039 (Opaque Data) and DDD principles, we are completely removing the `canvas_elements` table and structure parsing from the backend. The backend will solely store hierarchical nodes (`notebook_nodes`) and opaque encrypted binary payloads (`node_updates`).

## Consequences

### Positive
- **Cross-device Sync**: Users can safely use multiple devices or clear browser caches without losing access to their encrypted data.
- **Improved UX**: The system clearly distinguishes between "creating a password" and "unlocking", avoiding confusion.
- **Architectural Purity**: Removing `canvas_elements` from the backend enforces the Open/Closed Principle, allowing new engines (like Markdown) to be added without backend changes.

### Negative
- Requires a one-time migration to set up the `users` table.
- The server now has a minimal concept of identity, adding slight complexity to the API layer.

## References
- [ADR-030: Single-user Multi-engine Architecture](./030-single-user-multi-engine-architecture.md)
- [ADR-039: Local-First End-to-End Encryption](./039-local-first-e2ee.md)
