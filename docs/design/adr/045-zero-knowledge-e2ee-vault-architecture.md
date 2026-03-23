# ADR-045: Zero-Knowledge E2EE Vault Architecture

## Status
Accepted

## Context
SpatialNotes aims for "True End-to-End Encryption (E2EE)" and a "Zero-Knowledge Architecture". The previous implementation (ADR-039, ADR-043) was inconsistent in its key derivation and storage strategy. A more robust approach is required to ensure that the server never has access to the Data Encryption Key (DEK) or any information that could lead to its derivation.

## Decision
We implement a Zero-Knowledge Vault architecture where the server acts purely as an opaque storage for cryptographic salts and wrapped keys.

### 1. Key Derivation & Wrapping Flow

#### A. Signup (Vault Initialization)
1.  **Client-side Generation**:
    *   `salt_auth`: Random 32-byte salt for authentication.
    *   `encryption_salt`: Random 32-byte salt for key encryption.
    *   `DEK` (Data Encryption Key): Random 32-byte master key.
2.  **Key Computation (KDF)**:
    *   `Auth Token` = PBKDF2(Password, `salt_auth`, iterations=100,000, hash=SHA-256)
    *   `KEK` (Key Encryption Key) = PBKDF2(Password, `encryption_salt`, iterations=100,000, hash=SHA-256)
3.  **Key Wrapping**:
    *   `Wrapped DEK` = AES-GCM(DEK, KEK)
4.  **Server Submission**:
    *   Submit: `Auth Token`, `salt_auth`, `encryption_salt`, `Wrapped DEK`.
    *   *Note: Password, KEK, and DEK never leave the client.*

#### B. Server-side Storage
1.  **Incoming Auth Token**: The server receives the `Auth Token` and hashes it using Bcrypt before storage.
2.  **Opaque Data**: The server stores `salt_auth`, `encryption_salt`, and `Wrapped DEK` as opaque fields in the `users` table.

#### C. Login (Vault Unlocking)
1.  **Request Salts**: Client requests `salt_auth` and `encryption_salt` from the server.
2.  **Client Computation**: Client computes `Auth Token` and `KEK` using the same KDF parameters.
3.  **Submission**: Client sends `Auth Token` to the server.
4.  **Verification**: Server verifies the `Auth Token` against the Bcrypt hash.
5.  **Response**: Upon success, the server returns the `Wrapped DEK`.
6.  **Unwrapping**: Client decrypts `Wrapped DEK` using `KEK` to retrieve the `DEK`.

### 2. Cryptographic Standards
*   **KDF**: PBKDF2 with HMAC-SHA256 (Iterations: 100,000+).
*   **Encryption**: AES-256-GCM.
*   **Tokenization**: JWT is used for session management *after* successful authentication.
*   **Data Format**: JWK (JSON Web Key) representation should be used for exporting/importing keys where appropriate.

## Consequences

### Positive
*   **Maximum Privacy**: Even with full database access, an attacker cannot decrypt user notes.
*   **Stateless Server**: The server does not need to perform expensive cryptographic operations besides password hashing.
*   **Flexible Key Rotation**: The `DEK` can be re-wrapped with a new `KEK` (if the password changes) without re-encrypting the entire vault.

### Negative
*   **No Password Recovery**: If a user loses their password, the data is mathematically unrecoverable.
*   **Client-side Load**: PBKDF2 is computationally expensive on the browser (mitigated by Web Workers).

## References
*   [ADR-039: Local-First E2EE](./039-local-first-e2ee.md) (Superseded)
*   [ADR-043: User Management and Vault Setup](./043-user-management-and-vault-setup.md) (Superseded)
