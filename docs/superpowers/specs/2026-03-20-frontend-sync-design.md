# Design Spec: Phase 3 - Frontend & Real-time Sync

## 1. Problem Statement
The frontend needs to provide a high-performance, interactive "Magic Desk" experience while ensuring all user actions are synchronized in real-time across devices. This requires a robust integration between the React UI, the Yjs CRDT engine, and the Command Pattern logic from Phase 1.

## 2. Goals
- Implement the core "Magic Desk" UI using React and Framer Motion.
- Integrate Yjs with a WebSocket provider for real-time state synchronization.
- Bind UI interactions (drawing, moving, deleting) to the `CanvasCommand` system.
- Implement Glassmorphism and design tokens as defined in the UI design system.

## 3. Proposed Changes

### 3.1. `apps/web/src/hooks/useSync.ts`
- Implement a custom hook to manage the `Y.Doc` and `WebsocketProvider` connection.
- Provide a unified interface for broadcasting local command changes to the sync bus.

### 3.2. `apps/web/src/components/canvas/CanvasInteractionView.tsx`
- The main drawing surface using Canvas 2D or SVG.
- Handle mouse/stylus events and trigger `CanvasCommand` execution.
- Implement "Element Pop" animations using Framer Motion.

### 3.3. `apps/web/src/context/CommandContext.tsx`
- Provide global access to the `CommandHistory` and `CanvasCommand` execution logic.
- Handle keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z) for Undo/Redo.

### 3.4. UI Tokens & Glassmorphism
- Apply CSS variables for the "Magic Desk" dark theme.
- Implement the sidebar using `backdrop-filter: blur(12px)` and standard border tokens.

## 4. Implementation Plan
1. Set up the basic React project structure in `apps/web`.
2. Implement the `useSync` hook and Yjs initialization.
3. Build the `CanvasInteractionView` with basic stroke rendering.
4. Connect the UI actions to the `CanvasCommand` system and verify sync.

## 5. Verification Strategy (TDD)
- **Component Tests**: Use Vitest + React Testing Library to verify UI state.
- **SC-S1**: Verify cross-device move/sync using simulated Yjs updates.
- **SC-U7/U8**: Verify that UI-triggered Undo/Redo correctly reverts the visual state.
