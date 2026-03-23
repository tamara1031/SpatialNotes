# Use Case UC12: WYSIWYG Markdown Editing (ICONIX Style)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Student / Researcher |
| **Preconditions** | **Markdown Interaction View** is active; a Markdown Notebook is open; Vault is unlocked. |
| **Basic Flow (Rich Content Editing)** | 1. **User** types Markdown syntax (e.g., `#`, `**`, `-`) or uses a **Markdown Toolbar** (Boundary) in the editor.<br>2. **Editor Interface** (Boundary) captures input and updates the internal **Block-based Document Model** (Entity).<br>3. **Markdown Parser** (Control) processes the input using `pulldown-cmark` (WASM-based) to update the intermediate representation.<br>4. **WASM Rendering Engine** (Control) generates a real-time, high-fidelity visual preview of the blocks (WYSIWYG).<br>5. **Editor Interface** (Boundary) reflects the rendered content immediately to the user.<br>6. System performs **Encrypted Sync** (UC11) via the **Sync Gateway** (Boundary) to securely persist the changes. |
| **Alternate Flow (Slash Commands)** | 1. **User** types `/` in the editor.<br>2. **Editor Interface** (Boundary) displays a **Slash Command Menu** (Boundary) with options (e.g., Table, Image, LaTeX, Code Block).<br>3. **User** selects an option via keyboard or mouse.<br>4. System inserts the corresponding block into the **Document Model** (Entity). |
| **Alternate Flow (LaTeX Toggle)** | 1. **User** inserts or clicks on a **LaTeX Block** (Boundary).<br>2. If in rendered state, System toggles to **Raw Code View** for editing.<br>3. **User** modifies the LaTeX code.<br>4. **User** clicks outside or presses a shortcut.<br>5. **WASM Rendering Engine** (Control) re-renders the LaTeX block to its mathematical representation. |
| **Post-condition** | The user enjoys a fluid, Typora-like UX with real-time rendering and secure, encrypted storage. |
| **Business Rules** | **Rule 12.1**: The editor MUST maintain **Visual Stability**. Content MUST NOT "jump" or shift unexpectedly during rendering.<br>**Rule 12.2**: Elements MUST have stable, absolute-like positioning within the block flow to prevent cognitive load.<br>**Rule 12.3**: Real-time rendering latency MUST be imperceptible (<32ms). |
