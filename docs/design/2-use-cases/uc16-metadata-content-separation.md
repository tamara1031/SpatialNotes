# Use Case 16: Metadata/Content Separation & OPFS Cache

## 1. Summary
Optimizes performance and memory usage, especially on tablets, by separating lightweight metadata from heavy content. Uses the Origin Private File System (OPFS) for fast local persistence and SQLite for efficient querying of note lists.

## 2. Actors
- SyncManager
- OPFS (Web API)
- SQLite (Wasm)
- Go Backend

## 3. Preconditions
- User is logged in and vault is unlocked.

## 4. Main Flow (Initial Load)
1. **System Action (SyncManager)**: Fetches `GET /api/notes/metadata` (lightweight JSON).
2. **System Action (SyncManager)**: Compares local OPFS SQLite version with server version.
3. **System Action (SyncManager)**: Updates local SQLite cache with any changes.
4. **System Action (UI)**: Renders the Notebook Dashboard / List view instantly using local SQLite.

## 5. Main Flow (Note Opening / Lazy Loading)
1. **User Action**: Selects a note to open.
2. **System Action (Client)**: Checks if note content is in local OPFS cache.
3. **System Action (SyncManager)**: If not cached or stale, fetches `GET /api/notes/{id}/content`.
4. **System Action (Client)**: For E2EE notes, content is fetched as an opaque blob and decrypted in the Worker.
5. **System Action (UI)**: Renders the Canvas or Markdown editor.
6. **System Action (Client)**: Caches the content back to OPFS for subsequent offline access.

## 6. Business Rules
- **Rule 16.1**: Content (Strokes, Images, Text) MUST NOT be loaded into memory until the specific note is opened.
- **Rule 16.2**: The local metadata cache MUST be encrypted if the vault is locked (optional, depends on security vs speed trade-off; standard mode metadata might be plaintext locally).
- **Rule 16.3**: Memory usage MUST be monitored to prevent OOM when multiple heavy notes are opened (eviction policy).
