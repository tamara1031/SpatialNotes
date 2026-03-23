# ADR-002: Local-First + Hybrid Persistence

## Status
Accepted

## Context
SpatialNotes aims for a "Zero Sync Anxiety" experience. Users should never worry about whether their data is saved or synced, especially during unstable network conditions on tablets.

## Decision
We implement a **Local-First** persistence strategy:
1.  **Primary Storage**: Every user action is first committed to **IndexedDB** (browser) or **SQLite** (mobile/server).
2.  **Sync Trigger**: Broadcast over WebSockets/Yjs occurs ONLY after successful local commitment.
3.  **Conflict Resolution**: Use CRDTs (Yjs) to handle concurrent updates without a central authority needing to merge.

## Consequences
- **Pros**: Offline-capable, zero data loss on network failure, low perceived latency.
- **Cons**: Increased client-side complexity (IndexedDB management), storage limits on browsers.
