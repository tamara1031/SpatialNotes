# Auth Domain Detailed Design

The Authentication domain handles user identity, vault encryption keys, and session lifecycle.

## Responsibilities
- Secure login and registration.
- Generation and derivation of encryption keys using hybrid cryptography.
- Vault locking and unlocking flows.
- Interfacing with local/remote storage for session persistence.

## Key Components
- `VaultStore`: The central state management for UI authentication (Astro/React).
- `AuthHandler`: Backend Go service handling JWT generation and validation.
- `CryptoService`: Core utility handling key derivation from user credentials.

## Integration
Auth tightly integrates with the `VaultStore` to dictate the state of the `DesktopApp`.
