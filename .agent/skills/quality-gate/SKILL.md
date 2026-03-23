---
name: quality-gate
description: Use when maintaining code standards using Lint, Format, and Tidy.
---

# Quality Gate

## Overview
Maintain code standards using Lint, Format, and Tidy to ensure the codebase remains "Implementation Ready" and highly maintainable for both AI and Human contributors.

## When to Use
- **Triggering Symptoms**: 
  - "About to submit a task"
  - "Code looks messy"
  - "Wait, what's the lint command for Go?"
  - "Linting failed but I don't know why"
- **When NOT to use**: During active, exploratory coding where you're not ready for a commit or PR.

## Core Pattern: Full Audit -> Auto-Fix -> Tidy
Always run the Quality Gate BEFORE submitting a finished task through `notify_user`.

## Quick Reference
| Language | Operation | Command |
| --- | --- | --- |
| TS | Full Audit | `pnpm run lint && pnpm run format:check` |
| TS | Auto-Fix | `pnpm run lint:fix && pnpm run format:fix` |
| Go | Go Tidy | `go mod tidy` |
| Design | Sync Check | Verify `docs/design/*.md` and `.puml` diagrams reflect implementation. |

## Core Pattern: Full Audit -> Auto-Fix -> Architectural Alignment
Always run the Quality Gate BEFORE submitting a finished task.

1. **Static Analysis**: Run lint and format for all modified stacks.
2. **Dependency Tidy**: Ensure `go mod tidy` or `pnpm install` are up to date.
3. **Design Synchronization**: 
    - Check if the **Ubiquitous Language** needs new terms.
    - Ensure **ADRs** are updated or created for significant decisions.
    - Verify that **Robustness/Sequence/ER** diagrams match the actual logic and schema.
4. **Verification**: Confirm all unit and integration tests pass locally.
