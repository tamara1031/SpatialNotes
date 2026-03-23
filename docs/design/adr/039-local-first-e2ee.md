# ADR-039: Local-First End-to-End Encryption (E2EE)

## Status
Accepted

## Context
SpatialNotes requires a high-privacy, "Magic Desk" experience. We need to ensure that user data (strokes, text, notes) is encrypted on the client side before being sent to the server, while maintaining the performance required for sub-16ms inking latency and offline capability.

## Decision
We implement a **Local-First E2EE architecture** using keys derived from a master password.

### 1. Security Architecture
*   **Dual-Key Strategy**: 
    *   **Authentication Hash**: Derived via PBKDF2 + Local Salt, sent to the server for access verification. The server applies a secondary Argon2id hash before storage.
    *   **Vault Encryption Key**: Derived via HMAC-SHA256 from the Master Key. Stored only in volatile memory (Web Worker) and used for AES-256-GCM encryption.
*   **Offline Access**: The User Salt is stored in IndexedDB after the first login, allowing the KDF to run without a network connection.

### 2. Performance & Sync (Incremental Updates)
*   **Encrypted Yjs Updates**: Instead of re-encrypting entire notebooks, we encrypt binary deltas (Yjs updates).
*   **Encrypted & Compressed Attachments**: Large binary blobs (Images, PDFs) MUST be compressed (e.g., using `CompressionStream` API) then encrypted on the client before upload.
*   **Web Workers**: All cryptographic and compression operations are offloaded to Web Workers.

### 3. Privacy-Preserving Data Model
*   **Metadata Hiding**: Notebook names and links are moved into the encrypted payload.
*   **Opaque Nodes**: The `nodes` table only contains structural IDs (`id`, `parent_id`) and deletion status.

## 4. Verification Specification (Technical Test Cases)

### A. Unit Tests (Crypto & Logic)
- **SC-U12: Vault Key Derivation**: Derive `MasterKey`, `AuthHash`, and `VaultKey` via Argon2id. Repeated derivation with the same input produces the same output.
- **SC-U13: Incremental Update Pipeline**: Zlib compression + AES-256-GCM encryption. Decryption + Decompression returns the exact original binary.
- **SC-U15: Image Processing**: Large images downscaled to 2048px, converted to WebP, and encrypted.

### B. UI & Interaction Tests
- **SC-UI7: Unlock UI Flow**: Incorrect password shows error; vault remains Locked; no data is fetched.
- **SC-UI8: Initial Setup**: Random 32-byte salt generation; saved to IndexedDB; Auth Hash sent to server.

### C. System & Integration Tests
- **SC-S5: End-to-End Sync Loop**: Device A draws -> Encrypt -> POST -> Server (Opaque) -> Device B fetches -> Decrypt -> Apply. Device B sees the exact same stroke.

## Consequences
-   **Positive**: Highest level of user privacy; zero-knowledge server; high-performance interaction.
-   **Negative**: Increased client-side CPU usage for crypto; lost password results in permanent data loss (no "Password Reset" possible for the vault).
-   **Negative**: Initial setup requires generating and storing a local salt.

## References
- [Design Spec: E2EE Architecture](../superpowers/specs/2026-03-22-e2ee-architecture-design.md)
- [ADR-017: Local-First Strategy](./017-local-first-persistence-strategy.md)
- [ADR-035: Latency Budgets](./035-performance-and-latency-budgets.md)
