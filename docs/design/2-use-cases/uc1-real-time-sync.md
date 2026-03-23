# Use Case UC1: Secure Real-time Sync (Consolidated)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | User (Student / Researcher) |
| **Preconditions** | Notebook/Chapter is open; Vault is unlocked; Sync Gateway is active. |
| **Basic Flow (The "Silent Save" Experience)** | 1. **User** (Actor) interacts with the **Canvas/Markdown View** (Boundary).<br>2. System captures changes as **Binary Updates** (Entity) via Yjs.<br>3. System immediately persists updates to **Local OPFS Cache** (Infrastructure) for zero-latency durability.<br>4. System updates **Header Status Indicator** (Boundary) to "Unsaved changes".<br>5. **Sync Manager** (Control) debounces the sync (5s) or triggers immediately on "Save" command.<br>6. **Crypto Worker** (Control) encrypts the payload if E2EE strategy is active.<br>7. **Sync Gateway** (Boundary) pushes the binary deltas to the **Backend Relay** (Infrastructure).<br>8. System updates **Header Status Indicator** (Boundary) to "Saving...".<br>9. Upon server ACK, System updates **Header Status Indicator** (Boundary) to "Saved to Cloud". |
| **Alternative Flow (Offline Management)** | 1. If connection is lost, System updates status to "Offline - Saving locally".<br>2. Updates continue to be stored in the **Local OPFS Cache**.<br>3. When connection returns, **Sync Manager** automatically resumes and pushes queued deltas. |
| **Alternative Flow (Conflict Resolution)** | 1. If the server has a newer version, Yjs automatically merges the incoming deltas.<br>2. System reflects the merged state without user intervention (CRDT Convergence). |
| **Business Rules** | **Rule 1.1**: UI interaction MUST remain responsive (<16ms) regardless of sync state.<br>**Rule 1.2**: All heavy crypto/compression MUST run in a Web Worker.<br>**Rule 1.3**: The server MUST NEVER receive the Vault Key; all encryption is Client-Side (E2EE support).<br>**Rule 1.4**: Visual feedback (Status Indicator) MUST be clear and unobtrusive (Premium micro-animations). |
| **Post-condition** | Changes are durable, secure, and synchronized with zero friction for the user. |
