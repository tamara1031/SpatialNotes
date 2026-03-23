# Use Case 10: Vault Setup & Unlock (E2EE)

## 1. Summary
The SpatialNotes system is a local-first encrypted workspace. Before using the system, the user must initialize the vault by creating a Master Password. For subsequent visits, the user enters their Master Password to unlock the vault. The salt is securely stored on the server to allow cross-device synchronization without losing access to the encryption key. A JWT session is established upon successful unlock to protect API endpoints.

## 2. Actors
- User (Tablet/Stylus user)
- Browser (Crypto Engine / Web Worker)
- Go Backend (Authentication & Salt Provider)

## 3. Preconditions
- The backend server is running.
- For **Setup**, no user is currently registered on the server.
- For **Unlock**, a user has already registered and their salt/auth hash is stored on the server.

## 4. Main Flow A: Vault Setup (First Time)
1. **System Action**: Client queries the Go Backend (`GET /api/auth/status`). Backend returns `initialized: false`.
2. **System Action**: Client displays the **Setup Vault View**.
3. **User Action**: User enters a new Master Password and confirms it.
4. **System Action (Worker)**: Generates strong random 32-byte `SaltAuth` and `SaltEncryption`.
5. **System Action (Worker)**: Derives the **Authentication Token** and **Key Encryption Key (KEK)** using the Password and Salts.
6. **System Action (Worker)**: Generates a random **Data Encryption Key (DEK)** and wraps it with the **KEK**.
7. **System Action (Client)**: Sends `{ username: "admin", salt_auth: <base64>, salt_encryption: <base64>, wrapped_dek: <base64>, auth_token: <base64> }` to the Go Backend (`POST /api/auth/register`).
8. **System Action (Server)**: Creates the user and returns an **Access Token (JWT)**.
9. **System Action (Client)**: Stores the **DEK** and **KEK** in non-exportable memory (CryptoWorker), and transitions to "Unlocked" state.

## 5. Main Flow B: Vault Unlock (Returning User)
1. **System Action**: Client queries the Go Backend (`GET /api/auth/status`). Backend returns `initialized: true` and the Salts.
2. **System Action**: Client displays the **Unlock Vault View**.
3. **User Action**: Enters master password.
4. **System Action (Worker)**: Derives the **Authentication Token** and **KEK** using the Password and the provided Salts.
5. **System Action (Client)**: Sends the **Authentication Token** to the Go Backend (`POST /api/auth/login`).
6. **System Action (Server)**: Verifies the token against the stored hash and returns an **Access Token (JWT)** and the **Wrapped DEK**.
7. **System Action (Worker)**: Unwraps the **DEK** using the **KEK**.
8. **System Action (Client)**: Transitions to "Unlocked" state.


## 6. Alternate Flows
- **A1: Offline Mode (Unlock)**: If no network is detected, the client retrieves the `Salt` from IndexedDB and validates the Authentication Hash against a locally cached signature.
- **A2: Wrong Password (Unlock)**: If derivation/verification fails (server rejects auth hash), the system shows "Incorrect Password" via **Notification System**.
- **A3: Session Expiry**: If an API request returns 401 Unauthorized, the system transitions to "Locked" state and prompts for the Master Password.

## 7. Business Rules
- **Rule 10.1**: The plaintext password MUST NOT be stored locally or sent to the server.
- **Rule 10.2**: The Vault Encryption Key MUST NOT be stored in persistent storage (Local/IndexedDB).
- **Rule 10.3**: The system operates as a single-user system (ADR-030); the first user to register locks the instance.
