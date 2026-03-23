# Vault Domain Detailed Design

The Vault domain represents the secure storage perimeter for a user's nodes.

## Responsibilities
- Synchronizing local databases with remote data securely.
- Providing an encrypted interface to read/write domain entities.
- Maintaining the E2EE boundary.

## Key Components
- `SyncService`: Connects local Yjs state to remote server via WebSockets.
- `VaultManager`: Coordinates data fetching, initialization, and encryption.
- `NodeRepository`: The data access layer (OPFS/SQLite or Yjs).

## Integration
The Vault relies entirely on the Auth domain to provide the `CryptoService` instance initialized with the user's derived key.
