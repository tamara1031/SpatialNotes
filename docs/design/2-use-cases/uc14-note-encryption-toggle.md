# Use Case 14: Note Encryption Toggle (Hybrid Crypto)

## 1. Summary
The user can toggle the encryption level for each note individually from the editor toolbar. This allows users to choose between Standard (backend-encrypted at rest) and E2EE (client-side zero-knowledge) modes based on the sensitivity of the content.

## 2. Actors
- User (Tablet/Stylus user)
- NoteHeader (UI Component)
- CryptoWorker (Encryption Engine)
- Go Backend (Storage / Search Index)

## 3. Preconditions
- Vault is unlocked (Master Key is in memory).
- A note is currently open in the editor.

## 4. Main Flow (Switching to E2EE)
1. **User Action**: Clicks the "Encryption Toggle" in the Note Header toolbar.
2. **System Action (UI)**: Displays a confirmation dialog: "Enable E2EE? This note will be unsearchable on the server."
3. **User Action**: Confirms.
4. **System Action (Client)**: Updates Note Metadata locally with `encryption_level: "E2EE"`.
5. **System Action (Sync)**: Marks the note content as "dirty".
6. **System Action (Worker)**: Encrypts the current note content (Strokes/Markdown) using **XChaCha20-Poly1305** with the Note Key (derived from Master Key + Note ID).
7. **System Action (Sync)**: Sends the encrypted blob to the server.
8. **System Action (Server)**: Detects E2EE mode, saves the blob, and **purges** the previous plaintext version from the search index.

## 5. Main Flow (Switching to Standard)
1. **User Action**: Clicks the toggle to disable E2EE.
2. **System Action (UI)**: Displays confirmation: "Disable E2EE? Content will be stored in standard mode (at-rest encryption)."
3. **User Action**: Confirms.
4. **System Action (Worker)**: Decrypts the content in memory.
5. **System Action (Client)**: Updates metadata to `encryption_level: "Standard"`.
6. **System Action (Sync)**: Sends the plaintext (or backend-encrypted) content to the server.
7. **System Action (Server)**: Indexes the content for search.

## 6. Business Rules
- **Rule 14.1**: Metadata (Note ID, Title, Tags, Last Edited) is ALWAYS stored in Standard mode to allow fast listing and organization.
- **Rule 14.2**: The Note Encryption Key for E2EE MUST be derived on the fly and never stored persistently.
- **Rule 14.3**: Switching modes MUST trigger a full sync of the note content.
