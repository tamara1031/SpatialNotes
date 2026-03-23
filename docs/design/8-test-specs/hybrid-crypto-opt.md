# Test Specification: Hybrid Crypto and Tablet Optimization

## 1. Objective
To verify the correct implementation of note-level encryption toggles, XChaCha20-Poly1305 E2EE, OPFS-backed metadata caching, and stylus input optimizations.

## 2. Test Scenarios

### 2.1 Note Encryption Toggle (UI/UX)
- **ID**: TS-HC-01
- **Target**: `NoteHeader.tsx` + `SyncManager`
- **Verification**: 
  - Toggling "E2EE" on a Standard note triggers a re-sync with encryption.
  - Toggling "Standard" on an E2EE note triggers a re-sync with plaintext/backend encryption.
  - Metadata (Title, ID, Strategy) within the `metadata_payload` remains accessible in the note list regardless of the toggle.



### 2.2 AES-GCM-256 E2EE (Security)
- **ID**: TS-HC-02
- **Target**: `CryptoWorker.ts`
- **Method**: Vitest unit test.
- **Verification**: 
  - Encrypt with a 32-byte **DEK** and random **IV**.
  - Decrypt with the same key/iv retrieves original data.
  - Tampered ciphertext or wrong key fails authentication.


### 2.3 Stylus Input & Low Latency (Performance)
- **ID**: TS-TO-01
- **Target**: `InteractionHandler.ts` + `OffscreenCanvas`
- **Method**: Performance tracing.
- **Verification**: 
  - `PointerEvent` attributes (`pressure`, `tilt`) are captured and stored.
  - Predictive stroke is rendered on `OffscreenCanvas` within < 16ms of input.
  - Main stroke is finalized and smoothed after `pointerup`.

### 2.4 OPFS SQLite Cache (Storage)
- **ID**: TS-TO-02
- **Target**: `OPFSSqliteRepository.ts`
- **Verification**: 
  - `metadata_payload` is successfully persisted to OPFS.
  - Note list is populated from the local cache on subsequent reloads.
  - Content Payload (heavy updates) is fetched only when the note is opened (Lazy Loading).


### 2.5 Server-side E2EE Purging (Backend)
- **ID**: TS-BE-01
- **Target**: Go `NodeService`
- **Verification**: 
  - Switching a note to E2EE triggers a backend process that deletes all associated rows in the `elements` table.
  - E2EE notes return empty results for server-side content search.

## 3. Tooling
- **Vitest**: Unit/Integration tests.
- **Playwright**: E2E testing of the toggle and sync status.
- **Lighthouse / Chrome DevTools Performance**: Latency measurement.
