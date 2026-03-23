# ADR-050: Modular Store Architecture for Web Frontend

## Status
Accepted (Implemented)

## Context
`apps/web/src/store/vaultStore.ts` has grown into a large (200+ lines) file that mixes state management, infrastructure adapters, and complex orchestration logic. This makes it hard to maintain, test, and navigate.

## Decision
We will reorganize the store directory into specialized modules and move infrastructure adapters to a dedicated directory.

### Structure
- `apps/web/src/store/`:
    - `vault/`:
        - `vault.store.base.ts`: Base NanoStore for vault state.
        - `vault.store.ts`: Public API and initialization.
    - `auth/`:
        - `auth.actions.ts`: Login/Register logic (orchestrates core UseCases).
    - `sync/`:
        - `SyncService.ts`: Listens to `DomainEventBus` and executes `Command`s.
- `apps/web/src/infrastructure/`:
    - `VaultGateway.ts`: API implementations.

### UI State Pattern
UI states (like modals) MUST follow the "Conditional Rendering" pattern:
1. **Store**: Use a NanoStore with a `"closed"` state as default.
2. **Component**: Wrap the modal content in a conditional check `{state !== "closed" && (...)}` to ensure zero performance overhead and no visual artifacts when inactive.

## Consequences
- **Positive**:
    - Improved code clarity and separation of concerns.
    - Easier parallel development.
    - Simplified unit testing for individual modules.
- **Negative**:
    - More files to manage.
    - Need to be careful with circular dependencies between store modules.
