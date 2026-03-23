# Skills Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all local agent skills with the "Superpowers" standard for improved searchability and effectiveness.

**Architecture:** Systematic refactoring of `SKILL.md` files to include symptom-based descriptions, quick references, and common mistakes sections.

**Tech Stack:** Markdown, YAML.

---

### Task 1: Refactor codebase-analysis/SKILL.md

**Files:**
- Modify: `.agent/skills/codebase-analysis/SKILL.md`

- [ ] **Step 1: Apply the new SKILL.md content**

```markdown
---
name: codebase-analysis
description: Use when performing deep structural analysis and semantic search across the project.
---

# Codebase Analysis

## Overview
Perform deep structural analysis and semantic search to understand the impact of changes across the DDD layers.

## When to Use
- **Triggering Symptoms**: 
  - "How does changing this Domain entity impact Infrastructure?"
  - "Is internal/domain importing internal/infrastructure?"
  - "Are we using the Visitor pattern correctly here?"
- **When NOT to use**: For simple file reads or basic grep searches without cross-layer context.

## Core Pattern: Cross-Layer Impact
When changing a `Domain` entity, search for usages in `Application` services and `Infrastructure` adapters to ensure consistency.

## Quick Reference
| Operation | Command |
| --- | --- |
| Find Domain Usages | `grep -r "class [EntityName]" .` |
| Check Layer Integrity | `grep -r "import .*infrastructure" server/internal/domain/` |

## Common Mistakes
- Using only generic grep: You might miss usages in Go interfaces or TypeScript types.
- Ignoring `pnpm-lock.yaml`: Accidental dependency bloat.
```

- [ ] **Step 2: Verify frontmatter and structure**

Run: `grep "Use when" .agent/skills/codebase-analysis/SKILL.md`
Expected: `description: Use when performing deep structural analysis and semantic search across the project.`

- [ ] **Step 3: Commit**

```bash
git add .agent/skills/codebase-analysis/SKILL.md
git commit -m "refactor(skills): align codebase-analysis with superpowers standard"
```

---

### Task 2: Refactor quality-gate/SKILL.md

**Files:**
- Modify: `.agent/skills/quality-gate/SKILL.md`

- [ ] **Step 1: Apply the new SKILL.md content**

```markdown
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

## Common Mistakes
- Forgetting `go mod tidy`: This can lead to CI failures or inconsistent dependencies.
- Ignoring Biome errors: Biome is fast but strict.
```

- [ ] **Step 2: Verify frontmatter and structure**

Run: `grep "Use when" .agent/skills/quality-gate/SKILL.md`
Expected: `description: Use when maintaining code standards using Lint, Format, and Tidy.`

- [ ] **Step 3: Commit**

```bash
git add .agent/skills/quality-gate/SKILL.md
git commit -m "refactor(skills): align quality-gate with superpowers standard"
```

---

### Task 3: Refactor testing/SKILL.md

**Files:**
- Modify: `.agent/skills/testing/SKILL.md`

- [ ] **Step 1: Apply the new SKILL.md content**

```markdown
---
name: testing
description: Use when executing and automatically fix tests for Go and TypeScript.
---

# Testing

## Overview
Execute and automatically fix tests for Go and TypeScript following the "Quality Gate" strategy defined in ADR-010.

## When to Use
- **Triggering Symptoms**: 
  - "Test failed"
  - "Need to check coverage"
  - "Regression detected"
  - "How do I run tests for a specific package?"
- **When NOT to use**: For simple code changes without any tests or when using a project-specific test-driven-development skill.

## Core Pattern: Run Unit Tests -> Auto-Fix Cycle -> Coverage Check
When a test fails, identify the failing assertion and adjust implementation to meet the "Green" state.

## Quick Reference
| Language | Operation | Command |
| --- | --- | --- |
| TS | Run Unit Tests | `pnpm --filter [pkg] test:unit` |
| Go | Run Unit Tests | `go test ./internal/domain/...` |
| Both | Coverage Check | `pnpm test:unit --coverage` or `go test -coverprofile=coverage.out ./...` |

## Common Mistakes
- Not checking coverage for new domain logic: Domain logic should have >90% coverage.
- Ignoring regression tests: If it's a regression, revert to last known good state first.
```

- [ ] **Step 2: Verify frontmatter and structure**

Run: `grep "Use when" .agent/skills/testing/SKILL.md`
Expected: `description: Use when executing and automatically fix tests for Go and TypeScript.`

- [ ] **Step 3: Commit**

```bash
git add .agent/skills/testing/SKILL.md
git commit -m "refactor(skills): align testing with superpowers standard"
```
