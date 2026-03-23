# Use Case UC5: Hierarchical Note Management (ICONIX Style)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Student / Researcher |
| **Preconditions** | **Workspace View** or **Navigation Sidebar** is open. |
| **Basic Flow** | 1. **User** (Actor) selects a *Chapter* or *Notebook* node in the tree.<br>2. **User** (Actor) drags the node and drops it onto a target *Chapter* node.<br>3. System runs **Validate Move** (Control) to ensure no circular references.<br>4. System runs **Re-parent Node** (Control) to update the node's *parentId* (Entity).<br>5. System notifies the **Sidebar Boundary** to refresh the tree view. |
| **Alternate Flow** | 3a. If the move is invalid (e.g., dropping a folder into itself), System displays an error message. |
| **Post-condition** | The content structure is updated and synchronized across all devices, maintaining the nested context. |
