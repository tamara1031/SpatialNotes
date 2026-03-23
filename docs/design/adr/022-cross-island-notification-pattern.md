# ADR-022: Cross-Island Notification Pattern

## Status
Proposed

## Context
In an Island Architecture (Astro), UI components like the Sidebar and Canvas are isolated from each other. However, they need a unified way to provide user feedback (e.g., "Notebook deleted", "Sync Error"). 
Using a heavyweight React Context would require wrapping the entire application in a single island, defeating the performance benefits of Astro.

## Decision
We implement a lightweight, event-driven notification system using **Nano Stores**:

1.  **Global Notification Store**: A central, framework-agnostic store (`$notifications`) managed by Nano Stores.
2.  **Independent Notification Island**: A dedicated React component (`NotificationIsland.tsx`) that subscribes to the store and renders notifications using Framer Motion.
3.  **Imperative Triggering**: Any component (React, Astro, or even plain JS/Wasm bridge) can trigger a notification by calling a simple utility function `showNotification()`.

### Design Standards
- **Persistence**: Notifications automatically expire after a set duration (default 5s).
- **Undo Integration**: Notifications can optionally include an action (e.g., calling `undoManager.undo()`) to provide immediate recovery for destructive actions.
- **Positioning**: Fixed at the bottom-center to avoid interfering with top-level toolbars or sidebars.

## Consequences

### Positive
- **Decoupling**: The component triggering the notification doesn't need to know about the UI rendering it.
- **Performance**: Zero-JS Astro components can trigger notifications without being hydrated.
- **Consistency**: Single source of truth for all user feedback across the desk.

### Negative
- **State Lifetime**: Since it's a client-side store, notifications do not persist across full page refreshes (which is desired for ephemeral feedback).
