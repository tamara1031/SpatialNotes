---
name: ui-engine-standard
description: Use when building the "Magic Desk" UI using tokens, Glassmorphism, and Framer Motion.
---

# UI Engine Standard

## Overview
Implement the "Magic Desk" UI/UX vision, ensuring consistent use of design tokens, Glassmorphism effects, and Framer Motion physics.

## When to Use
- **Triggering Symptoms**: 
  - "Starting a new React component"
  - "UI looks flat or inconsistent"
  - "What's the HSL for Surface color?"
  - "How do I implement the shadow pop on drag?"

## Core Pattern: Astro Layout -> Island Architecture -> Wasm Engine
- **Astro Layout**: Use `.astro` components for the static shell.
- **Island Architecture**: Use `client:load` or `client:idle` for interactive React components (e.g., the Canvas).
- **Wasm Engine**: All performance-critical ink math MUST be handled in `canvas-wasm` (Rust).

## Quick Reference
| Component Type | Visual Standard | Tech Implementation |
| --- | --- | :--- |
| UI Shell | Layout/Typography | Astro (.astro) |
| Canvas Interaction | Dark felt-like texture (`hsl(210, 10%, 12%)`) | React Island + Wasm |
| Sidebar | Glassmorphism blur (`12px`) | React Island |
| Animation Physics | `Spring` physics | Framer Motion |

## Common Mistakes
- Hydrating everything: Use Astro for static elements to keep the main thread light.
- Redundant logic: Don't implement smoothing in JS if Wasm handles it.
