# ADR-006: Markdown & LaTeX Support for Text Elements

## Context
Users need to add structured information (math formulas, formatted notes) to the canvas. Storing only plain text limits the "Magic Desk" vision for researchers and students.

## Decision
Text Elements will support **Markdown and LaTeX** rendering:
1.  The `content` field stores raw string data.
2.  The Frontend uses a rendering engine (e.g., MathJax/KaTeX for LaTeX, marked for Markdown) to display the content.
3.  Export visitors (PDF/SVG) must perform high-fidelity conversion of these formats to vector/print instructions.

## Status
Accepted

## Consequences
- **Positive**: High-value feature for academic users; "Magic Clipboard" can handle complex scientific snippets.
- **Negative**: Increases frontend bundle size; requires complex logic in export visitors to maintain fidelity.
