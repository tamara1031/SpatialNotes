# ADR-011: SpatialNote Native Clipboard Format

## Context
Users want to "Copy and Paste" entire notebooks or groups of pages between workspaces or even into other applications.

## Decision
We define a **SpatialNote JSON (SNJ)** format for clipboard operations:

1.  **Structure**:
    ```json
    {
      "version": "1.0",
      "source": "spatial-notes",
      "nodes": [ ... ] 
    }
    ```
2.  **MIME Type**: `application/x-spatialnote+json`.
3.  **Fallback**: The plain text clipboard will contain the public URL of the notebook (if available) or the names of the copied nodes.
4.  **Security**: Pasting into a new workspace regenerates all IDs to prevent collision.

## Status
Accepted

## Consequences
- **Positive**: Enables the "Everything is a Node" mobility; easy to share snippets.
- **Negative**: Pasting large notebooks might cause performance spikes during ID mapping.
