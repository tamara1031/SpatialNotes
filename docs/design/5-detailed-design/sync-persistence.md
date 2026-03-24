# Detailed Design: Synchronization & Persistence

## Status
Accepted

## Context/Goal
The synchronization and persistence system ensures a "Zero Sync Anxiety" experience by prioritizing local-first data integrity. The goal is to provide seamless, conflict-free synchronization across multiple devices while minimizing server load and maintaining low perceived latency.

## Architecture
The system employs a **Local-First** approach combined with **Yjs (CRDT)** for synchronization.

- **Primary Storage**: Every user action is first committed to **IndexedDB** in the browser.
- **Sync Protocol**: Uses **Yjs** binary deltas over **WebSockets** for real-time (or periodic) updates.
- **Synchronization Logic**: The `apps/web` application shell orchestrates debounced, periodic cloud syncs, decoupling network timing from the performance-critical interaction thread.

## Components
- **SyncService / SyncManager**: Intercepts commands from the engines and debounces network operations. Displays clear visual feedback (e.g., "Saved Locally", "Saving to Cloud").
- **Yjs Engine (CRDT)**: Handles conflict-free merging of state updates.
- **Go WebSocket Hub**: Forwards binary Yjs deltas to connected clients and persists the document state to the server-side database.
- **IndexedDB Storage**: The source of truth for the local session, ensuring data persists across page reloads and network outages.
- **WebSocket Gateway**: Manages the binary `y-websocket` protocol between the frontend and backend.

## Sequence/Data Flow
### 1. Real-time Synchronization (UC1)
1. **Local Commit**: An interaction (e.g., drawing a stroke) is immediately saved to the `CanvasStore` and IndexedDB.
2. **Debounced Trigger**: The `SyncService` accumulates changes and triggers a cloud sync after a period of inactivity (e.g., 10-30s) or via an explicit manual save (`Ctrl+S`).
3. **Delta Push**: Binary Yjs deltas are pushed to the Go server over WebSockets.
4. **Relay**: The server broadcasts the deltas to all other connected sessions of the same user.
5. **Merge**: Receiving clients merge the deltas into their local Yjs documents, updating the UI.

### 2. Offline Mode
1. **Detection**: The `SyncService` monitors the WebSocket connection state.
2. **Status Update**: If disconnected, the UI displays "Saved locally (Offline)".
3. **Reconnection**: Upon regaining a connection, the `SyncService` performs a full state synchronization to push any pending local deltas.

## Testing Considerations
- **Offline Reliability**: Simulate network drops during active editing and verify that data is correctly synced upon reconnection.
- **Conflict Resolution Integrity**: Test concurrent edits on the same notebook from multiple devices to ensure Yjs merges states without data loss or corruption.
- **Storage Limits**: Monitor IndexedDB usage and implement purging strategies for large document histories if necessary.
- **Latency Benchmarking**: Ensure that the background sync process does not introduce stutters or "hitching" in the main interaction thread.
