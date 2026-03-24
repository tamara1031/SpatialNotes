# ADR-042: Markdown Engine Design and Synchronization Strategy

## Status
Accepted

## Context
As part of ADR-030 (Single-user Multi-engine Architecture), the system must support a `markdown-engine` alongside the `canvas-engine`. This engine needs to handle structured text, LaTeX rendering (ADR-006), and efficient synchronization within the `NoteViewShell`.

## Decision
The `markdown-engine` will implement a **block-based data model** utilizing **ProseMirror** as the core editing framework. This choice provides the necessary flexibility for a hierarchical document structure that can be easily mapped to the `BaseElement` collection pattern used in the system.

### 1. Data Model (`MarkdownElement`)
A document is represented as a collection of `MarkdownElement` objects.
- `type`: `MARKDOWN_BLOCK`
- `metadata`:
    - `kind`: `PARAGRAPH` | `HEADER` | `LIST` | `CODE` | `MATH` | `IMAGE` | `TABLE`
    - `content`: Raw text or serialized JSON for complex blocks.
    - `order`: A fractional index for stable ordering.

### 2. ProseMirror Integration
The engine uses ProseMirror with a custom schema:
- **Schema**: Maps standard Markdown nodes plus custom nodes for `KaTeX` (Math) and specialized elements.
- **NodeViews**: Used for interactive blocks like LaTeX (toggle between code and rendered view).
- **Sync Bridge**: A plugin or specialized `getState`/`update` logic that bridges ProseMirror's `doc` with the flattened `MarkdownElement[]` array. It uses stable node IDs (via a ProseMirror plugin) to maintain block-level identity across edits.

### 3. Synchronization Strategy
- **Granular Updates**: Only blocks that have changed (detected by ID and content hash) are emitted to the `NoteViewShell`.
- **WASM Acceleration**: `pulldown-cmark` (WASM) is used for high-fidelity Markdown parsing during initial import and final export, ensuring compatibility with the project's performance budgets.

## Consequences

### Positive
- **Industry Standard**: ProseMirror is highly extensible and proven for complex WYSIWYG editors.
- **Stability**: Rich set of plugins (tables, history, keymaps) reduces implementation risk.
- **Granular Sync**: Maintains the performance benefits of block-based synchronization.
