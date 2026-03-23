# Design Spec: Tech Stack and Configuration Refinement

## 1. Problem Statement
The current technology stack and configuration are mostly solid, but there are gaps in the specialized rendering package (`canvas-engine`), the enforcement of the newly added Command Pattern for Undo/Redo, and the formal inclusion of recent architectural decisions (ADR-014) in the agent rules.

## 2. Goals
- Initialize the `packages/canvas-engine` directory with a standard TypeScript/Vitest setup.
- Update `typescript-shared.md` to include specific rules for the Command Pattern (Undo/Redo).
- Update `project-standards.md` to formally include `ADR-014` and its concurrency/performance constraints.

## 3. Proposed Changes

### 3.1. `packages/canvas-engine/`
- **`package.json`**: Initialize with `name: "canvas-engine"`, `version: "1.0.0"`, and `devDependencies` matching `core`.
- **`tsconfig.json`**: Extend the root or `core` configuration for TypeScript consistency.

### 3.2. `.agent/rules/typescript-shared.md`
- **Command Pattern Enforcement**: Add rules requiring all canvas-altering actions to be implemented as subclasses of `CanvasCommand`.
- **History Management**: Ensure the `CommandHistory` stack is the single source of truth for local Undo/Redo.

### 3.3. `.agent/rules/project-standards.md`
- **ADR-014 Integration**: Add a section on MVP Concurrency and Undo Strategy, including the 50-page/500-element limits and LWW register behavior for metadata.

## 4. Implementation Plan
1. Create `package.json` and `tsconfig.json` in `packages/canvas-engine/`.
2. Update `.agent/rules/typescript-shared.md` with Command Pattern rules.
3. Update `.agent/rules/project-standards.md` with ADR-014 details.
4. Commit all changes following project standards.

## 5. Verification Strategy
- Verify that `pnpm install` works and detects the new package.
- Manually review the updated rule files for accuracy and alignment with Stage 0-5 designs.
