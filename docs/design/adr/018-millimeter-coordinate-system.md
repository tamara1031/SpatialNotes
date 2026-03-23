# ADR-003: Physical-First (Millimeter) Coordinate System

## Status
Accepted

## Context
Handwritten notes must retain their physical proportions regardless of the screen size or resolution. Exporting to PDF (A4/B5) must be 1:1 scale to be useful for printing or professional sharing.

## Decision
All internal spatial calculations and storage use **millimeter (mm)** as the base unit instead of pixels.
1.  **Precision**: Stores as floats with 2 decimal places.
2.  **Transformation**: The UI layer (Astro/React) handles the `mm -> px` conversion based on the current viewport zoom and device DPI.
3.  **Engine**: `canvas-engine`, `canvas-wasm`, and `PDFExporter` operate strictly on `mm` units.

## Consequences
- **Pros**: Device-independent rendering, perfect print fidelity, consistent stroke widths.
- **Cons**: Slightly higher CPU overhead for frequent coordinate conversions during rendering.
