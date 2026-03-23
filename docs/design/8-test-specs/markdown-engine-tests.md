# Test Specification: Markdown Engine (WYSIWYG & WASM)

## 1. Unit Testing (Whitebox)

### 1.1. Markdown Parser (`pulldown-cmark` / WASM)
- **TC-MD-1.1.1**: Successfully parse basic Markdown syntax (headings, bold, italics, lists).
- **TC-MD-1.1.2**: Handle nested lists and complex Markdown structures.
- **TC-MD-1.1.3**: Validate AST generation for non-standard or malformed Markdown.
- **TC-MD-1.1.4**: Performance test: Parse a large Markdown file (1MB+) within 50ms (ADR-035).

### 1.2. LaTeX Processing
- **TC-LTX-1.2.1**: Correctly identify LaTeX blocks (`$$...$$` or `$ ... $`).
- **TC-LTX-1.2.2**: Verify WASM-based LaTeX rendering accuracy (mathematical representation vs. raw code).
- **TC-LTX-1.2.3**: Test the toggle mechanism (Rendered View <-> Code View).
- **TC-LTX-1.2.4**: Handle invalid LaTeX syntax gracefully with user-friendly error messages.

### 1.3. Block Management (`BlockManager`)
- **TC-BLK-1.3.1**: Adding, removing, and reordering blocks (paragraph, table, image, LaTeX).
- **TC-BLK-1.3.2**: Ensuring block IDs are unique and stable across edits.
- **TC-BLK-1.3.3**: Validate serialization/deserialization to/from JSON.

### 1.4. Crypto & Security (`CryptoService`)
- **TC-SEC-1.4.1**: Encrypting and decrypting the block-based JSON payload with the `VaultKey`.
- **TC-SEC-1.4.2**: Verifying that image URLs are encrypted before storage.
- **TC-SEC-1.4.3**: Handling decryption failures (incorrect key or corrupted data).

## 2. Integration Testing

### 2.1. WYSIWYG Editor Interface
- **TC-ED-2.1.1**: Real-time rendering as the user types (debounce vs. immediate).
- **TC-ED-2.1.2**: Slash command menu activation and item selection.
- **TC-ED-2.1.3**: Toolbar formatting (Bold, Italic, Headings) updates the document state.
- **TC-ED-2.1.4**: Drag-and-drop / Paste images into the editor.

### 2.2. Engine Registry & Selection
- **TC-REG-2.2.1**: Creating a notebook with `engineType: MARKDOWN` activates the correct interaction view.
- **TC-REG-2.2.2**: Switching between notebooks of different engine types (Canvas <-> Markdown) works seamlessly.

### 2.3. UX & Feedback
- **TC-UX-2.3.1**: Display "Processing image..." notification immediately after paste.
- **TC-UX-2.3.2**: Show progress bar during encrypted asset upload.
- **TC-UX-2.3.3**: Notify "Offline" state when sync gateway fails.
- **TC-UX-2.3.4**: Alert user on "Sync Conflict" and offer reload.

## 3. End-to-End (E2E) Scenarios

### 3.1. Complex Note Creation
1. Create a new Markdown Notebook.
2. Type Markdown headings and paragraphs.
3. Insert a LaTeX equation via slash command.
4. Toggle the LaTeX block to edit raw code and toggle back.
5. Create a 3x3 table and fill it with data.
6. Paste an image from the clipboard.
7. Verify that "Processing" and "Uploading" notifications appear.
8. Verify that all content is saved, encrypted, and correctly rendered upon reload.

### 3.2. Offline & Sync Reliability
1. Edit a Markdown note while offline.
2. Verify local persistence in IndexedDB.
3. Go online and ensure the encrypted updates are synced to the backend.

## 4. Performance & Resource Benchmarks
- **PB-1**: Initial WASM engine load time < 200ms.
- **PB-2**: Rendering latency < 16ms (60 FPS feel).
- **PB-3**: Memory usage stability during long editing sessions.
- **PB-4**: Visual Stability: Content deviation MUST be 0px during rendering (no layout shift).
