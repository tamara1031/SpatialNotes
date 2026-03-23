# ADR-046: Hybrid Encryption Strategy (Standard & E2EE)

## Status
Proposed (Supersedes E2EE-only implicit requirements in ADR-039/045)

## Context
Initial design assumed all note content should be End-to-End Encrypted (E2EE). However, E2EE prevents server-side features like high-performance full-text search, AI indexing, and multi-user collaborative editing without complex client-side re-encryption. For many "Standard" notes, at-rest encryption on the server is sufficient and UX is prioritized. Specifically for tablet optimization, we need a way to selectively enable E2EE.

## Decision
We adopt a **Hybrid Encryption Strategy** selectable at the "Note" (Notebook/Chapter) level.

### 1. Encryption Strategies
- **STANDARD**: 
  - Data is encrypted "At-Rest" on the server.
  - The server holds the keys (managed by the backend service).
  - Enables server-side processing (Search, AI indexing).
- **E2EE (End-to-End)**:
  - Data is encrypted on the client using XChaCha20-Poly1305.
  - The server acts as "Zero-Knowledge" storage (ADR-045).
  - Server-side indexing is purged for these notes.

### 2. Ubiquitous Language Refactoring
To support this hybrid model, we rename key entities to be encryption-agnostic:
- `encrypted_updates` -> `node_updates`
- `encryption_level` -> `encryption_strategy`
- `Opaque Payload` -> `Update Payload`

### 3. Implementation Logic
- **Sync**: The `SyncService` checks the `encryption_strategy` before pushing updates.
- **Node Metadata**: `name` and other visual metadata are bundled into a unified `metadata_payload` BLOB.
- **Content Payload**: Actual node data is stored in the `payload` field of the `node_updates` table.
- **Backend Purging**: When a note is switched from STANDARD to E2EE, the backend MUST purge any plaintext search indices derived from previous standard updates.



## Consequences

### Positive
- **Flexibility**: Users can choose between "Maximum Privacy" (E2EE) and "Maximum Feature Set" (Standard).
- **Consistency**: Unified sync protocol regardless of the encryption method.

### Negative
- **Complexity**: Client and Server must handle both flows.
- **Data Loss (Search)**: Switching to E2EE irreversibly removes server-side search capabilities for that note.

## References
- [ADR-045: Zero-Knowledge E2EE Vault Architecture](./045-zero-knowledge-e2ee-vault-architecture.md)
- [ADR-001: Hybrid Partitioned Persistence Model](./001-hybrid-partition-model.md)
