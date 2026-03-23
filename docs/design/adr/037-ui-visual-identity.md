# ADR-037: UI Visual Identity & Glassmorphism

## Status
Accepted

## Context
SpatialNotes aims for a "Magic Desk" experience—a premium, modern, and high-fidelity interface. This requires a cohesive design system that balances aesthetics with the needs of a low-latency handwriting application.

## Decision
We adopt a **Dark Mode First** design system based on Glassmorphism and minimal block design.

### 1. Design Tokens (CSS Variables)

#### Color Palette
| Token | Value | Usage |
|---|---|---|
| `--surface` | `hsl(220, 15%, 7%)` | Main background |
| `--surface-felt` | `hsl(220, 10%, 10%)` | Canvas area bg |
| `--surface-raised` | `hsl(220, 12%, 13%)` | Cards, inputs |
| `--surface-overlay` | `hsla(220, 15%, 15%, 0.9)` | Dropdowns, menus |
| `--accent` | `hsl(210, 100%, 65%)` | Active state |
| `--accent-glow` | `hsla(210, 100%, 65%, 0.25)` | Glow effects |
| `--accent-subtle` | `hsla(210, 100%, 65%, 0.08)` | Hover bg |
| `--danger` | `hsl(0, 80%, 60%)` | Delete/error |

#### Typography
- **Core Font**: `Outfit` (Google Fonts).
- **Hierarchy**: Sidebar `13px`, Header `14px`, Body `15px`.

#### Glassmorphism
- `--glass-bg`: `hsla(220, 15%, 12%, 0.7)`
- `--glass-border`: `hsla(0, 0%, 100%, 0.08)`
- `--blur`: `16px`

### 2. Iconography Standards
- **Inline SVG**: Lucide style (24×24, 1.8 strokeWidth, round caps).
- **Consistency**: UI icons in `apps/web`, Engine icons in `packages/canvas-engine`.

### 3. Interaction Patterns
- **Glassmorphism Notifications**: Bottom-centered snack-bars with spring animations and "Undo" actions.
- **Micro-interactions**: `0.15s` hover transitions; spring physics for mounting canvas elements.

## Consequences
- **Positive**: High premium feel, consistent UX across different engine types.
- **Negative**: High blur (`16px`) may have performance implications on lower-end devices (monitored via [ADR-035](./035-performance-and-latency-budgets.md)).
