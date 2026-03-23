# Nodes Domain Detailed Design

The Nodes domain encompasses all user-generated content entities, from folders (Chapters) to infinite canvases (Notebooks) and their elements.

## Responsibilities
- Tree hierarchy resolution.
- Polymorphic behavior of content nodes.
- Canvas state mutation and drawing logic execution.
- Applying CRDT changes to ensure eventually consistent real-time collaboration.

## Key Components
- `Node` Entity: Abstract base class for all file system and canvas objects.
- `Chapter` Entity: Represents hierarchical grouping.
- `Notebook` Entity: Represents the infinite canvas containing drawing elements.
- `CanvasElement`: Base for strokes, images, and text.
- `CreateNodeUseCase`: Orchestrates the creation and linking of nodes.
- `RenameNodeUseCase`: Dispatches node rename events.

## Integration
Nodes are persisted to the Vault using `INodeRepository` and synchronized via the `SyncService` CRDT logic.
