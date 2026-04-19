# ADR-051: Typed Engine Command Contract

## Status
Accepted (Implemented) — refines ADR-030 §3

## Context
ADR-030 ("Single-user Multi-engine Architecture") specified that engines must
emit commands "that match the `core` command structure (`type: CREATE | UPDATE
| DELETE`, `payload: NodeRecord | UpdateRequest`)" so the shell can apply
changes without translation logic.

In practice, the shell's dispatcher and the canvas engine had drifted from that
contract:

- The command type field was stringly-typed (`type: string`) with `any`
  payloads at every boundary (`commandDispatcher.ts`, `useNoteCommands.ts`,
  `EngineViewProps.onCommand`).
- The shell emitted `{ type: "UPDATE_ENCRYPTION", payload: strategy }` from
  `NoteHeader`, which silently fell through the dispatcher's `default` branch
  ("Unknown command type") and never persisted the encryption strategy.
- `UpdateElementsCommand` in `@spatial-notes/core` was typed to accept
  `NodeRecord[]` (full records) but the canvas engine emits partial deltas
  (`{ id, changes }[]`). The mismatch was masked by Yjs's forgiving merge but
  caused lost fields in practice.

## Decision
We formalise the shell ↔ engine command surface as a discriminated union and
align the core Command classes with the shapes engines actually emit.

### 1. Discriminated union at the shell boundary
A single `EngineCommand` type, defined in `apps/web/src/commands/types.ts`, is
the only vocabulary the shell's dispatcher understands:

```ts
export type EngineCommand =
    | { type: "CREATE"; payload: NodeRecord }
    | { type: "DELETE"; payload: { id: string } }
    | { type: "UPDATE_ELEMENTS"; payload: ElementUpdate[] }
    | { type: "UPDATE_NODE"; payload: Partial<NodeRecord> & { id: string } }
    | { type: "BATCH"; payload: EngineCommand[] };
```

`ElementUpdate = { id: string; changes: Partial<NodeRecord> }` is re-exported
from `@spatial-notes/core` so engines and shell share a single source of truth.

`EngineViewProps.onCommand` (`apps/web/src/engines/engineRegistry.tsx`) is
typed as `(cmd: EngineCommand) => void`, making non-conforming emissions a
compile error at the shell boundary even though individual engine packages
keep a loose internal `(cmd: any) => void` prop to avoid cross-package type
coupling.

### 2. Delta-aware Core commands
`UpdateElementsCommand` now accepts `ElementUpdate[]` and performs the merge
(including `metadata` shallow-merge and `updatedAt` bumping) inside its
`execute()`, matching how the canvas engine emits updates.

`UpdateNodeCommand` likewise bumps `updatedAt` on merge.

### 3. Dispatcher is instantiation, not translation
`dispatchCommand(cmd, ctx)` is a total `switch` over the union — each arm
instantiates the appropriate core `Command` and executes it. This is
*Command-pattern instantiation*, not the per-engine translation layer ADR-030
warned against. All runtime branches are exhaustive; TypeScript flags any new
variant that's added to the union but not handled.

### 4. Encryption toggles use `UPDATE_NODE`
The shell's `NoteHeader` emits
`{ type: "UPDATE_NODE", payload: { id, encryptionStrategy } }` rather than a
bespoke `UPDATE_ENCRYPTION` type. Any future per-node field toggle follows
the same pattern.

## Consequences

### Positive
- **Compile-time exhaustiveness**: Missing or misspelled command types are
  caught at the shell boundary.
- **Bug closed**: The encryption toggle now persists.
- **Single source of truth**: `ElementUpdate` is defined once in core and
  reused across engines and dispatcher.
- **Extensibility preserved**: Adding a new command (e.g.,
  `RESTORE_DELETED`) requires updating the union, the core Command, and one
  dispatcher arm — mechanical, not architectural.

### Negative
- **Engines remain loosely typed internally**: `canvas-engine` and
  `markdown-engine` don't import `EngineCommand` (to avoid a reverse
  package dependency), so the contract is only enforced at the shell seam.
  Engine-side misuse surfaces as a shell-side type error when the engine
  view is wired up.

## References
- ADR-030 §3 "Direct Command Bridge" — parent decision refined here.
- ADR-049 "Command Storage Abstraction" — defines `IKeyValueStore` the core
  Commands execute against.
- `apps/web/src/commands/types.ts`, `apps/web/src/commands/commandDispatcher.ts`
- `packages/core/src/application/commands.ts`
