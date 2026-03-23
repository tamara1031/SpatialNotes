# ADR-049: Decoupled Command Bus and Storage Abstraction

## Status
Accepted (Implemented)

## Context
Command classes in `packages/core/src/application/commands.ts` currently take `yjs.Map` directly as a dependency. This ties our application logic to a specific CRDT library and makes unit testing difficult without polyfilling or mocking `yjs` complex structures.

## Decision
We will introduce an `IStore` interface in `@spatial-notes/core/src/application/common/IStore.ts` that represents a dictionary-like storage. The application's `Command` classes will interact with this interface. Infrastructure adapters (e.g., `YjsNodeRepository`) will implement this interface.

### Interface
```typescript
export interface IKeyValueStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  keys(): string[];
  transact(action: () => void): void;
}
```

## Consequences
- **Positive**:
    - Application logic becomes storage-agnostic.
    - Testing commands becomes trivial using a simple `Map` based mock.
    - Easier to swap or augment `yjs` with other persistence mechanisms (e.g., SQLite directly).
- **Negative**:
    - Small overhead for the abstraction layer.
 Marble/Yjs specific features (like deep observe) might need careful mapping.
