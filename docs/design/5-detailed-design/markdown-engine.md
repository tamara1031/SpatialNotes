# Detailed Design: Markdown Engine

## Status
Accepted

## Context/Goal
The Markdown Engine provides a full WYSIWYG editing experience for structured text within SpatialNotes. It supports GitHub Flavored Markdown (GFM), LaTeX (via KaTeX), and real-time collaboration using Yjs. The design follows a block-based model to maintain performance and consistency across different engines.

## Architecture
The engine uses **ProseMirror** as its core editing framework, rendered by the `MarkdownView` component and synchronized through command callbacks.

- **Block-Based Data Model**: A document is represented as a collection of `MarkdownElement` objects (e.g., PARAGRAPH, HEADING, TABLE, LATEX).
- **WASM-Accelerated Parsing**: Utilizes `pulldown-cmark` (Wasm) for high-fidelity Markdown parsing during initial import and final export.
- **Command Bridge**: ProseMirror transactions are converted into `UPDATE_ELEMENTS` commands that are emitted to the host via `onCommand`.

## Components
- **ProseMirror Editor**: The main UI component handling text input, selections, and commands.
- **KaTeX Integration**: Custom ProseMirror NodeViews for interactive LaTeX blocks that toggle between raw code and rendered math.
- **MarkdownParser (WASM)**: Processes raw strings into an Abstract Syntax Tree (AST) for the editor.
- **Document Mapping**: `mapDocToElements` transforms ProseMirror nodes into `MarkdownElement[]`.
- **Command Emitter**: `onCommand` receives normalized updates for the host engine/shell.
- **Block ID Plugin**: `blockIdPlugin` keeps block identity stable while editing.

## Sequence/Data Flow
### 1. Markdown Editing (UC12)
1. **User Interaction**: The user types content or uses the editor toolbar.
2. **Block Update**: `dispatchTransaction` applies changes and maps the updated ProseMirror document into `MarkdownElement[]`.
3. **Parsing/Rendering**:
    - Raw content is parsed via `pulldown-cmark` (WASM).
    - The resulting AST is rendered using specialized Wasm or React-based renderers.
4. **State Propagation**: The view emits `UPDATE_ELEMENTS` through `onCommand`, and the host coordinates persistence/sync responsibilities.

### 2. LaTeX Rendering (ADR-006)
1. **Detection**: The parser identifies LaTeX delimiters (e.g., `$`, `$$`) in the text.
2. **Interactive NodeView**: The editor renders a specialized `KaTeX` block.
3. **Live Preview**: Mathematical formulas are rendered in real-time as the user types.

## Testing Considerations
- **Concurrency Verification**: Ensure that concurrent edits on the same or adjacent blocks resolve correctly without data loss via Yjs.
- **Parser Performance**: Benchmark `pulldown-cmark` (WASM) for large document imports.
- **KaTeX Fidelity**: Verify complex LaTeX formulas render correctly and match the exported SVG/PDF output.
- **Flicker-Free Rendering**: Ensure that block-level updates do not cause visible UI jumps or lost focus.
