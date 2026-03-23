# ADR-031: Flattened Notebook-Element Hierarchy

## Status
Accepted

## Context
Initial design followed a traditional `Notebook -> Page -> Element` hierarchy. However, real-time synchronization (Yjs) and infinite canvas requirements revealed that the `Page` entity was redundant and introduced unnecessary depth to the data structure. Most drawing operations already bypass the Page entity, treating elements as direct children of the Notebook (or active node).

## Decision
We remove the `Page` entity from the core data model. 
1. Elements now link directly to their parent `Notebook` (or `Chapter` if allowed, but primarily `Notebook`).
2. "Page" becomes a logical/view-side concept. Page boundaries (A4/B5) are rendered as guides and handled during export (PDF/SVG) based on cumulative height/Y-coordinates.
3. Metadata for defaults (e.g., `default_page_format`) is moved to the `Notebook` entity.

## Consequences
- **Pros**: 
  - Simplified Yjs map structure.
  - Reduced complexity for spatial queries (one less layer to traverse).
  - Greater flexibility for fluid/infinite canvases.
- **Cons**: 
  - Requires manual calculation of "page numbers" for legacy-style navigation if needed.
  - Breaking change for the internal hierarchy (mitigated by current implementation already bypassing it).
