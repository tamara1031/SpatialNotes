# Detailed Design: Authentication & E2EE

## Status
Accepted

## Context/Goal
SpatialNotes implements a robust Zero-Knowledge Architecture to ensure user privacy and data security. The goal is to provide a "Magic Desk" experience where user data is encrypted on the client side before reaching the server, while also supporting a "Hybrid Encryption Strategy" that allows users to choose between maximum privacy (E2EE) and maximum features (Standard).

## Architecture
The system uses a **Zero-Knowledge Vault** where the server acts purely as an opaque storage for salts and wrapped keys.

- **Dual-Key Strategy**: 
    - **Authentication Hash**: Derived via PBKDF2 with HMAC-SHA256, used for server-side verification (further hashed with Bcrypt on the server).
    - **Vault Encryption Key (DEK)**: A random 32-byte master key stored in volatile memory (Web Worker) and wrapped with a Key Encryption Key (KEK).
- **Hybrid Strategy**: Supports `STANDARD` (at-rest encryption on server) and `E2EE` (client-side encryption via XChaCha20-Poly1305) selectable at the note level.

## Components
- **AuthService**: Manages the authentication lifecycle (Signup, Signin, Logout).
- **CryptoWorkerProxy**: Offloads expensive cryptographic operations (PBKDF2, Argon2id, AES-GCM) to a Web Worker to maintain UI responsiveness.
- **VaultManager**: Manages the encryption/decryption state, including storing keys in volatile memory and handling the "Lock/Unlock" logic.
- **Go Backend (Opaque Storage)**: Stores salts (`salt_auth`, `encryption_salt`) and the `Wrapped DEK`.

## Sequence/Data Flow
### 1. Vault Initialization (Signup)
1. **Client Generation**: Generates `salt_auth`, `encryption_salt`, and the master `DEK`.
2. **KDF Computation**: Computes `Auth Token` and `KEK` via PBKDF2 (100,000 iterations).
3. **Key Wrapping**: Wraps the `DEK` with the `KEK` using AES-GCM.
4. **Server Submission**: Sends `Auth Token`, salts, and the `Wrapped DEK` to the server. The raw password, KEK, and DEK never leave the client.

### 2. Vault Unlocking (Signin - UC10)
1. **Salt Fetch**: Client requests `salt_auth` and `encryption_salt` from the server.
2. **KDF Computation**: Client computes `Auth Token` and `KEK` from the user-provided password and fetched salts.
3. **Login Request**: Sends `Auth Token` to the server for verification against the Bcrypt-hashed version.
4. **Unwrapping**: Upon success, the server returns the `Wrapped DEK`, which the client decrypts using the `KEK` to retrieve the `DEK`.

## Testing Considerations
- **Zero-Knowledge Verification**: Audit server-side logs and database state to ensure no plaintext content or keys are ever stored or transmitted.
- **KDF Performance**: Measure the time for PBKDF2 iterations in the browser (target <1s on mobile devices).
- **Hybrid Logic**: Verify that switching a note from `STANDARD` to `E2EE` correctly triggers client-side re-encryption and server-side index purging.
- **Lock/Unlock Integrity**: Ensure no data is accessible in the UI until the `VaultManager` transitions to the `unlocked` state.
