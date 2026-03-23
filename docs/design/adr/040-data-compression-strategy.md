# ADR-040: Data Compression Strategy

## Status
Accepted

## Context
SpatialNotes handles high-volume binary data (Yjs updates) and large assets (Images). To minimize network latency, reduce storage costs, and stay within the 16ms interaction budget, we need a consistent compression strategy across the stack.

## Decision
We implement a multi-layered compression strategy:

### 1. Client-Side (Pre-Encryption)
*   **Target**: Yjs updates and Binary Attachments (Images).
*   **Mechanism**: All data MUST be processed **before** encryption.
*   **Algorithms**: 
    *   **Yjs Deltas**: Zlib/Deflate (via `CompressionStream` API) remains for repetitive binary CRDT data.
    *   **Images**: 
        *   **Format**: Non-WebP images MUST be converted to **WebP** (lossy, typically 75-80% quality).
        *   **Resizing**: Images larger than a "Retina-sufficient" threshold (e.g., max 2048px on the longest side) MUST be downscaled to reduce footprint.
*   **Offloading**: Image processing and conversion must occur in the `CryptoWorker` or a specialized `MediaWorker` to avoid UI jank.

### 2. API Level (Server-Side)
*   **Target**: JSON API responses (Node hierarchy, search results).
*   **Mechanism**: Standard HTTP Gzip compression.
*   **Implementation**: Go backend will use a standard Gzip middleware for all `/api/*` routes.

## Consequences
- **Positive**: Significant reduction in bandwidth usage (especially for large stroke collections).
- **Positive**: Reduced storage footprint in SQLite and Blob Store.
- **Negative**: Slight increase in CPU usage on the client for compression/decompression.
- **Note**: Server-side compression should be disabled for `/api/blobs` and `/api/nodes/:id/updates` as the payloads are already compressed and encrypted by the client.
