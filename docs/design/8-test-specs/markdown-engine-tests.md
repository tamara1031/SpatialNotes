# Test Specification: Markdown Engine (ProseMirror-based)

## 1. Unit Testing (Whitebox)

### 1.1. Markdown Parser (`pulldown-cmark` / WASM)
- **TC-MD-1.1.1**: Parse basic Markdown syntax into ProseMirror-compatible block structures.
- **TC-MD-1.1.2**: Handle complex Markdown (nested lists, tables, code blocks).
- **TC-MD-1.1.3**: Performance test: Parse large document within 50ms.

### 1.2. LaTeX Processing (ProseMirror + KaTeX)
- **TC-LTX-1.2.1**: Correctly identify LaTeX nodes in ProseMirror document.
- **TC-LTX-1.2.2**: Verify KaTeX rendering within the NodeView.
- **TC-LTX-1.2.3**: Test the toggle mechanism (Rendered View <-> Code View) via NodeView.
- **TC-LTX-1.2.4**: Handle invalid LaTeX syntax with error display in NodeView.

### 1.3. Block Management & Sync Bridge
- **TC-BLK-1.3.1**: Validate mapping from ProseMirror hierarchical `doc` to flattened `MarkdownElement[]`.
- **TC-BLK-1.3.2**: Ensuring block IDs are stable across document transformations (split, merge, move).
- **TC-BLK-1.3.3**: Validate synchronization: Only modified blocks trigger `onCommand`.

## 2. Integration Testing

### 2.1. ProseMirror Editor Interface
- **TC-ED-2.1.1**: Real-time rendering as the user types with zero layout shift.
- **TC-ED-2.1.2**: Slash command menu activation (`/`) and block insertion.
- **TC-ED-2.1.3**: Markdown shortcuts (e.g., `# ` for H1) trigger correct schema transforms.
- **TC-ED-2.1.4**: Drag-and-drop / Paste images into the editor.

### 2.2. Engine Registry & Selection
- **TC-REG-2.2.1**: Creating a notebook with `engineType: MARKDOWN` activates the ProseMirror interaction view.
- **TC-REG-2.2.2**: Switching between Canvas and Markdown engines works without state loss.

## 3. End-to-End (E2E) Scenarios

### 3.1. Full User Journey (Account & Document)
1. **Signup**: Create a new account from a clean database state.
2. **Notebook Creation**: Create a new Markdown Notebook.
3. **Editing**:
    - Type Markdown headings and paragraphs.
    - Insert a LaTeX equation via slash command.
    - Create a 3x3 table and fill it.
    - Paste an image.
4. **Persistence**: Verify that content is saved and encrypted.
5. **Reload**: Refresh the page and verify all elements (including LaTeX and tables) render correctly.
6. **Deletion**: Delete the notebook and verify it is removed from the sidebar and database.

### 3.2. Offline & Sync Reliability
1. Edit a Markdown note while offline.
2. Verify local persistence in IndexedDB.
3. Go online and ensure the encrypted updates are synced to the backend.

## 4. Performance & Resource Benchmarks
- **PB-1**: Initial ProseMirror engine load time < 200ms.
- **PB-2**: Interaction latency < 16ms (60 FPS feel).
- **PB-3**: Visual Stability: Content deviation MUST be 0px during rendering (no layout shift).
