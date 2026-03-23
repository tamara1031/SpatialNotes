# ADR-013: Pluggable Infrastructure & Self-Hosting Strategy

## Status
Proposed (Post-MVP)

## Context
SpatialNotes aims to be a robust self-hosted solution. Different users have different requirements for data volume (Local SQLite vs Cloud Postgres) and file storage (DB Blobs vs S3). 

## Decision
We will enforce an **Interface-Driven Infrastructure** for all side-effect-heavy components. However, for the **MVP**, we will stick to hardcoded defaults (SQLite, Local Files) while keeping the interfaces ready for future extension.

1. **Blob Storage (`BlobStore`)**:
    - Abstract the storage of images and file attachments.
    - **MVP Default**: `LocalFileBlobStore`.
    - **Future**: `S3BlobStore`.

2. **Authentication (`AuthManager`)**:
    - **MVP**: Out of scope (Session-based via URL token).
    - **Post-MVP**: `SimpleAuth`, `OIDCAuth`.

3. **Search Engine (`SearchProvider`)**:
    - **MVP**: Out of scope.
    - **Post-MVP**: `SqliteFTS`, `Meilisearch`.

## Consequences
- **Positive**: Simplified MVP delivery while maintaining architectural path to robustness.
- **Negative**: Manual refactoring will be needed post-MVP to implement these providers.
