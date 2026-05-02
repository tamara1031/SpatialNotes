# Detailed Design: Markdown Engine

## Status
Accepted

## Context/Goal
The Markdown Engine provides a WYSIWYG editing experience for structured text in SpatialNotes. It supports GFM-style authoring, LaTeX blocks, and command-based synchronization with the host shell.

## Architecture
The engine uses **ProseMirror** as its editing runtime and `MarkdownView` as the UI integration point.

- **Block Data Model**: A document is represented as `MarkdownElement[]` where each element type is one of `PARAGRAPH | HEADING | TABLE | IMAGE | LATEX | CODE`.
- **Transaction-to-Command Bridge**: `dispatchTransaction` maps changed ProseMirror docs into `MarkdownElement[]` and emits `UPDATE_ELEMENTS` through `onCommand`.
- **Stable Block Identity**: `blockIdPlugin` preserves/assigns block IDs to reduce churn during editing.
- **Worker-backed Markdown Utilities**: `MarkdownWorkerGateway` wraps `MarkdownWorker` for `parseMarkdown` and `renderHtml` using `markdown-wasm`.

## Components
- **`MarkdownView`**: Creates/destroys `EditorView` per active note, applies editor plugins, and emits normalized update commands.
- **ProseMirror Plugins**: Input rules, history, gap/drop cursor, table editing, and slash-menu key handling.
- **`LaTeXNodeView`**: Specialized NodeView for editable/rendered LaTeX blocks.
- **`mapDocToElements`**: Converts ProseMirror nodes to `MarkdownElement` for shell persistence.
- **`MarkdownWorkerGateway` / `MarkdownWorker`**: Async parse/render utilities backed by Wasm.

## Sequence/Data Flow
### 1. Markdown Editing
1. User edits content in `MarkdownView`.
2. ProseMirror applies a transaction in `dispatchTransaction`.
3. If the document changed, `mapDocToElements` converts the doc into `MarkdownElement[]`.
4. The engine emits `UPDATE_ELEMENTS` via `onCommand` to the host application.

### 2. Markdown Parse/Render Utilities
1. Host/client calls `MarkdownWorkerGateway.parseMarkdown` or `renderHtml`.
2. Gateway sends RPC messages to `MarkdownWorker`.
3. Worker calls `parse_to_blocks` or `markdown_to_html` from `markdown-wasm`.
4. Worker returns results (or errors) through RPC responses.

## Testing Considerations
- Verify `UPDATE_ELEMENTS` is emitted only on `docChanged` transactions.
- Validate block type mapping between ProseMirror node names and `MarkdownElement.type`.
- Ensure LaTeX NodeView edit/render behavior remains stable.
- Test worker gateway parse/render behavior and error propagation.
