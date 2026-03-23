# ADR-042: Markdown Engine Design and Synchronization Strategy

## Status
Proposed

## Context
As part of ADR-030 (Single-user Multi-engine Architecture), the system must support a `markdown-engine` alongside the `canvas-engine`. This engine needs to handle structured text, LaTeX rendering (ADR-006), and efficient synchronization within the `NoteViewShell`.

## Decision
The `markdown-engine` will implement a **block-based data model** rather than a single large text blob. This aligns the engine's internal structure with the `BaseElement` collection pattern used in the `canvas-engine`.

### 1. Data Model (`MarkdownElement`)
A document is a collection of `MarkdownElement` objects. Each block (paragraph, header, list item, etc.) is a separate element:
- `type`: `MARKDOWN_BLOCK`
- `metadata`:
    - `kind`: `PARAGRAPH` | `HEADER` | `LIST` | `CODE` | `MATH` | `IMAGE`
    - `content`: Raw text content of the block.
    - `order`: A fractional index (string-based) to maintain stable block ordering during concurrent edits.
    - `level`: (For headers) 1-6.

### 2. Implementation of `EngineInterface`
The `markdown-engine` will satisfy the `EngineInterface<MarkdownElement, MarkdownViewport, MarkdownEngineContext>`:
- **`mount(container)`**: Initializes a lightweight block-based editor (e.g., Codemirror 6 or a custom ProseMirror wrapper).
- **`update(patch)`**: Synchronizes blocks from the `NoteViewShell`.
- **`getState()`**: Provides the current list of blocks and the scroll position (`MarkdownViewport`).
- **`onAction`**: Signals `STATUS_CHANGED`, `LINK_CLICKED`, or `IMAGE_UPLOAD` events to the shell.

### 3. Rendering and LaTeX
The engine will integrate `KaTeX` for live LaTeX rendering as defined in ADR-006. Blocks of type `MATH` will be rendered as display math, while inline math will be handled within `PARAGRAPH` content.

## Consequences

### Positive
- **Granular Sync**: Reduces conflicts and improves performance by syncing only modified blocks.
- **Mixed Media Ready**: Allows easy insertion of other element types (e.g., a canvas stroke block) between text blocks in the future.
- **Consistent API**: Reuses the `BaseElement` sync logic already implemented in the shell.

### Negative
- **Complexity**: Requires a "Block Orchestrator" within the engine to manage the editing experience across multiple text buffers.
- **Ordering**: Managing fractional indices for block ordering is more complex than a single text string.
