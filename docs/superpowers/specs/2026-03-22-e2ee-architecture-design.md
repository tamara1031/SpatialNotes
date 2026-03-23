# Design Spec: End-to-End Encryption (E2EE) Architecture (v2)

| Property | Value |
| :--- | :--- |
| **Status** | Draft |
| **Topic** | End-to-End Encryption & Local-First Persistence |
| **Author** | Gemini CLI (Architect) |
| **Date** | 2026-03-22 |

## 1. Executive Summary
SpatialNotes provides a high-privacy, "Magic Desk" experience. This design implements a **Local-First E2EE architecture** where data is encrypted using keys derived from a master password. To balance privacy and performance, we utilize **Encrypted Incremental Updates** (Binary deltas) instead of full-notebook snapshots, ensuring the server remains a zero-knowledge relay while maintaining sub-16ms interaction latency.

## 2. Strategic Design Goals
1.  **Zero-Knowledge Privacy**: The server never sees the master password, the encryption key, or the notebook structure (links/names).
2.  **Local-First Autonomy (ADR-017)**: Users can unlock and edit their vault entirely offline using locally stored salts.
3.  **High-Performance Inking (ADR-035)**: Cryptographic operations are offloaded to **Web Workers** to maintain a 60fps UI.
4.  **Sync-Friendly (ADR-019)**: Encrypted binary updates allow for conflict-free merging via CRDTs (Yjs) without server-side decryption.

---

## 3. Security Architecture

### 3.1. Key Derivation & Authentication
We use a **Deterministic Dual-Key Strategy** to enable offline access.

1.  **Password Input + Local Salt** (Stored in IndexedDB after first setup).
2.  **KDF (PBKDF2)** -> **Master Key (256-bit)**.
3.  **Derivation (HMAC-SHA256)**:
    -   **Authentication Hash**: Sent to server. The server applies a secondary **Argon2id** hash before storage to prevent dictionary attacks.
    -   **Vault Encryption Key**: Held in memory (non-exportable `CryptoKey`).

### 3.2. Encryption Protocol
-   **Algorithm**: AES-256-GCM (Authenticated Encryption).
-   **Granularity**: **Incremental Update Bundling**. Instead of re-encrypting the whole notebook, we encrypt binary deltas (Yjs updates) or small logical chunks.

---

## 4. Data Model & Sync

### 4.1. Privacy-Preserving Schema

**`nodes` (Opaque Metadata Table)**
- `id` (UUID, PK)
- `parent_id` (UUID, FK)
- `is_deleted` (BOOLEAN)
- *Note: Names and links are moved to the encrypted payload.*

**`encrypted_updates` (Sync Table)**
- `node_id` (UUID, FK)
- `update_id` (Incremental ID)
- `payload` (BINARY/BLOB): **Encrypted Yjs/JSON Delta**
- `updated_at` (BIGINT)

### 4.2. Payload Structure (Decrypted)
```json
{
  "type": "SNAPSHOT | DELTA",
  "content": {
    "metadata": { "title": "...", "links": [...] },
    "strokes": [...],
    "markdown": "..."
  }
}
```

---

## 5. System Workflows

### 5.1. The "Magic Desk" Lifecycle
1.  **Unlock**: Password + Local Salt -> `Vault Key` (Web Worker).
2.  **Load**: Fetch encrypted updates from IndexedDB -> Decrypt -> Merge into Y.Doc.
3.  **Edit**: Canvas engine interacts with plaintext Y.Doc.
4.  **Sync**: New changes -> Encrypt Delta -> Save to IndexedDB -> Relay to Server.

---

## 6. Future Work & Roadmap

| Feature | Strategy | Status |
| :--- | :--- | :--- |
| **Markdown Mode** | Store MD text in encrypted snapshots/deltas. | Pending |
| **Knowledge Graph** | Reconstruct graph on client-side after decrypting `links`. | Deferred |
| **Local Search** | Build client-side index (MiniSearch) in a Web Worker. | Deferred |
| **Incremental Backup**| Accumulate encrypted binary deltas for efficient sync. | **Proposed** |

---

## 7. Quality Gates & Verification
1.  **Security Audit**: Ensure `Vault Key` never leaves the Web Worker / Memory.
2.  **Latency Check**: Verify encryption of a stroke delta takes < 5ms.
3.  **Offline Check**: Confirm Vault can be unlocked without network access.
