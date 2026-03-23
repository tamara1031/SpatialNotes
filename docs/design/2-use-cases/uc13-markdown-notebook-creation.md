# Use Case UC13: Selecting Notebook Engine on Creation (ICONIX Style)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Student / Researcher |
| **Preconditions** | **Workspace View** or **Navigation Sidebar** is active; User is authenticated. |
| **Basic Flow (Notebook Creation)** | 1. **User** (Actor) clicks the **Create New Item** button (Boundary).<br>2. **Workspace View** (Boundary) presents a **Creation Modal** (Boundary) with options for **Chapter**, **Canvas Notebook**, and **Markdown Notebook**.<br>3. **User** (Actor) selects **Markdown Notebook**.<br>4. System invokes **Create New Note** (Control) with the selected `engineType` (e.g., `MARKDOWN`).<br>5. **MetadataStore** (Entity) creates a new node entry with the specified engine type.<br>6. **User Interface** (Boundary) navigates to the newly created Markdown Notebook, activating the **Markdown Interaction View**. |
| **Alternate Flow (Canvas Creation)** | 3a. **User** selects **Canvas Notebook**.<br>4a. System creates a note with `engineType: CANVAS` and navigates to the **Canvas Interaction View**. |
| **Post-condition** | The user can choose the appropriate engine (Canvas or Markdown) at the time of creation, ensuring distinct workflows for different learning tasks. |
