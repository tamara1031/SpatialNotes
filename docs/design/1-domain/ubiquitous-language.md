# Ubiquitous Language (ICONIX Step 1)

All content in SpatialNotes is treated as a **Node** within a physical-spatial hierarchy.

| Term | Domain Entity | Logic Role |
| :--- | :--- | :--- |
| **Workspace** | `Workspace` | Root container for the user. |
| **Chapter** | `Chapter` | Structural container for nodes (Folders). |
| **Notebook** | `Notebook` | A collection of drawing/text content. |
| **Element** | `CanvasElement` | Drawing content (Stroke, Image, Text). |
| **Update** | `NodeUpdate` | Atomic unit of content change, stored as binary deltas (Yjs). |
| **Payload** | `ContentPayload` | The actual data (Metadata or Content) within an update, encrypted if E2EE. |
| **Command** | `Command` | Encapsulated user logic (Create, Delete, Move). |
| **History** | `Y.UndoManager` | Native CRDT stack for unified Undo/Redo. |
| **Eraser** | `PartialEraser` | Precision tool for splitting strokes (ADR-015). |
| **Encryption** | `EncryptionStrategy` | The security model for a note (`STANDARD` or `E2EE`). |



### Core Concept: The Positioned Node
Every `CanvasElement` (Stroke, Image, etc.) is a specialized **Leaf Node** that is serialized into a **Node Update**. These updates are stored as binary payloads in the `node_updates` table. This ensures that the source of truth remains the CRDT (Yjs) state while the relational structure manages the organization.

