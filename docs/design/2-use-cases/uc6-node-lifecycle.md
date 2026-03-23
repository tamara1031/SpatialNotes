# Use Case UC6: Node Lifecycle (Rename & Safe Delete)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Student / Researcher |
| **Preconditions** | Sidebar or Notebook View is open; User is logged in. |
| **Basic Flow (Rename)** | 1. **User** (Actor) double-clicks a Node name.<br>2. System displays an inline **Editor Boundary**.<br>3. **User** enters a new name.<br>4. System runs **RenameNodeUseCase** (Control).<br>5. **RenameNodeUseCase** validates and updates the **Node** Entity.<br>6. **RenameNodeUseCase** publishes **NodeRenamed** Domain Event.<br>7. **SyncService** (Control) reacts to the event and persists change via **UpdateNodeCommand** (Infrastructure). |
| **Basic Flow (Delete)** | 1. **User** selects "Delete" for a Node.<br>2. System runs **DeleteNodeUseCase** (Control).<br>3. **DeleteNodeUseCase** delegates to **SubtreeDeletionService** (Domain Service).<br>4. **SubtreeDeletionService** marks the target node and descendants as `isDeleted`.<br>5. **DeleteNodeUseCase** publishes **NodeDeleted** Domain Event for each affected node.<br>6. **SyncService** (Control) reacts and persists via **DeleteElementCommand** (Infrastructure).<br>7. System triggers **Notification Boundary** (Undo snack-bar). |
| **Post-condition** | The node and its entire sub-tree are logically removed (marked deleted) and synchronized across devices. |

