# ADR-048: Domain Event System for Node Lifecycle

## Status
Accepted (Implemented)

## Context
Currently, the `@spatial-notes/core` package lacks a mechanism for modules to react to changes in the domain without direct coupling. For example, if we want to trigger a sync or a notification when a node is created, we have to call those services directly within the UseCase or Store Action. This violates the Open/Closed Principle and makes testing more difficult.

## Decision
We will use a decoupled domain event system where entities capture state changes and application services publish those changes.

1. **Event Bus**: A centralized `DomainEventBus` handles all asynchronous communication between layers.
2. **Event Collection**: Entities (e.g., `Node`) MUST collect domain events locally in an internal array when their state changes (e.g., in `rename()` or `delete()`).
3. **Delayed Publication**: Application UseCases or Domain Services are responsible for pulling collected events from entities and publishing them to the `globalEventBus` after successful persistence.
4. **Consistency**: This ensures that events are only published if the state change is successfully saved to the repository.
5. **Infrastructure Reactivity**: The `SyncService` in the web application subscribes to these events to trigger persistence commands.

### Key Components
- **`IDomainEvent`**: Base interface for all domain events (in `src/domain/events/DomainEventBus.ts`).
- **`DomainEventBus`**: Central service to manage subscribers and publish events.
- **`NodeCreatedEvent`, `NodeRenamedEvent`, etc.**: Specific event implementations in `src/domain/nodes/events.ts`.

## Consequences
- **Positive**:
    - Better decoupling between domain logic and infra side-effects (sync, search indexing).
    - Reduced redundancy in UseCases by centralizing recursion in Domain Services.
    - Improved testability via event verification on entities and the event bus.
    - Guaranteed consistency by publishing events only after persistence.
- **Negative**:
    - Slight increase in architectural complexity.
    - Need to remember to clear domain events after publication.
