# Use Case UC4: Absolute Size Management & Pixel-Perfect Export (ICONIX Style)

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Student |
| **Preconditions** | **Export Settings Modal** is open; a *Notebook* aggregate exists. |
| **Basic Flow** | 1. **User** (Actor) requests "Export to SVG" via the **Canvas Header** (Boundary).<br>2. System runs **Trigger Exporting** (Control) on the *Canvas Engine* (Entity).<br>3. System uses **Gather Elements** (Control) from the *Canvas Store* (Entity).<br>4. System uses **Map Elements to WASM** (Control) via the *Wasm Bridge* (Entity), translating known supported objects (`ELEMENT_STROKE`, `ELEMENT_TEXT`, `ELEMENT_IMAGE`).<br>5. System performs **export_svg()** (Control) extracting vector paths and embedding images via the *Wasm Engine* (Entity).<br>6. System interacts with the **Browser Download API** (Boundary) via **Initiate Download** (Control).<br>7. **Browser Downloads** (Actor) obtains the final file for the **User** (Actor). |
| **Alternate Flow** | 4a. If the WASM mapping fails or skips elements, a structured log is recorded and the export process gracefully proceeds with the supported elements. |
| **Post-condition** | A high-precision SVG file suitable for high-quality printing or vector editing is safely generated, containing all valid vector elements present on the canvas. |
