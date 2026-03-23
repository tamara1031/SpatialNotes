# Design Implementation Skills & Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement specialized skills and rules to support ICONIX flow, DDD architecture, and Magic Desk UI.

**Architecture:** Creation of new skill directories, `SKILL.md` files, and an agent rule file.

**Tech Stack:** Markdown, YAML.

---

### Task 1: Implement design-compliance skill

**Files:**
- Create: `.agent/skills/design-compliance/SKILL.md`

- [ ] **Step 1: Create directory**

Run: `mkdir -p .agent/skills/design-compliance`

- [ ] **Step 2: Create SKILL.md**

```markdown
---
name: design-compliance
description: Use when verifying that implementation matches ICONIX design and ADRs.
---

# Design Compliance

## Overview
Ensure every feature follows the "Magic Desk" design suite (ICONIX + DDD) and adheres to Architectural Decision Records (ADRs).

## When to Use
- **Triggering Symptoms**: 
  - "Starting a new feature"
  - "Implementation feels inconsistent with the design docs"
  - "How should this sequence diagram map to code?"
  - "Is this change violating an ADR?"

## Core Pattern: Spec -> ADR Check -> Implementation Alignment
Before implementing, verify the use case in `docs/design/2-use-cases/` and relevant ADRs in `docs/design/adr/`.

## Quick Reference
| Target | Doc Location |
| --- | --- |
| Use Case | `docs/design/2-use-cases/uc*.md` |
| ADRs | `docs/design/adr/*.md` |
| Data Model | `docs/design/4-data-model/data-model.md` |
```

- [ ] **Step 3: Verify structure**

Run: `ls .agent/skills/design-compliance/SKILL.md`
Expected: File exists.

- [ ] **Step 4: Commit**

```bash
git add .agent/skills/design-compliance/SKILL.md
git commit -m "feat(skills): add design-compliance skill"
```

---

### Task 2: Implement ddd-enforcement rule

**Files:**
- Create: `.agent/rules/ddd-enforcement.md`

- [ ] **Step 1: Create rule file**

```markdown
# DDD Layer Enforcement & DI
# applyTo: server/internal/**, packages/core/**, apps/web/src/**

## Core Rules
1. **Domain Layer Independence**: The `domain/` layer MUST NOT import from `application/`, `infrastructure/`, or `interfaces/`. It must be pure business logic and repository interfaces.
2. **Dependency Injection**: Use DI for all infrastructure dependencies (DB, API, Storage). If a service cannot be tested with a `FakeRepository`, it must be refactored to use DI.
3. **Layer Isolation**:
    - **Application** orchestrates **Domain**.
    - **Infrastructure** implements **Domain** repository interfaces.
    - **Interfaces/UI** delivers data from **Application**.

## Verification
- Run `grep -r "import .*infrastructure" server/internal/domain/` - Should be empty.
- Every Domain entity must have a corresponding test using a Fake.
```

- [ ] **Step 2: Verify file existence**

Run: `ls .agent/rules/ddd-enforcement.md`
Expected: File exists.

- [ ] **Step 3: Commit**

```bash
git add .agent/rules/ddd-enforcement.md
git commit -m "feat(rules): add ddd-enforcement rule"
```

---

### Task 3: Implement ui-engine-standard skill

**Files:**
- Create: `.agent/skills/ui-engine-standard/SKILL.md`

- [ ] **Step 1: Create directory**

Run: `mkdir -p .agent/skills/ui-engine-standard`

- [ ] **Step 2: Create SKILL.md**

```markdown
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

## Core Pattern: Token Usage -> Glassmorphism Layer -> Animation Physics
Reference `docs/design/0-requirements/ui-design-system.md` for all visual tokens.

## Quick Reference
| Component Type | Visual Standard |
| --- | --- |
| Canvas Element | Dark felt-like texture (`hsl(210, 10%, 12%)`) |
| Sidebar | Glassmorphism blur (`12px`) + border (`1px solid hsla(0, 0%, 100%, 0.1)`) |
| Highlight | Accent blue (`hsl(200, 100%, 65%)`) |
| Interactions | `Spring` physics via Framer Motion for Element Pop. |

## Common Mistakes
- Hardcoding colors: Always use the design tokens.
- Ignoring backdrop-filter: Ensure Glassmorphism blur is applied to overlays.
```

- [ ] **Step 3: Verify structure**

Run: `ls .agent/skills/ui-engine-standard/SKILL.md`
Expected: File exists.

- [ ] **Step 4: Commit**

```bash
git add .agent/skills/ui-engine-standard/SKILL.md
git commit -m "feat(skills): add ui-engine-standard skill"
```
