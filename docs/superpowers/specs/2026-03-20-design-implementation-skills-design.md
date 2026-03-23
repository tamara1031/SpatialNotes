# Design Spec: Design and Implementation Skills & Rules

## 1. Problem Statement
The current agent skills and rules do not fully cover the specialized architectural (DDD), process (ICONIX), and visual (Magic Desk UI) requirements of the SpatialNotes design. To ensure consistent and high-quality implementation, specialized skills and rules are needed.

## 2. Goals
- Add `design-compliance` skill for ICONIX and ADR alignment.
- Add `ui-engine-standard` skill for Magic Desk UI/UX consistency.
- Add `ddd-enforcement` rule for DDD layer isolation and DI enforcement.
- Align all additions with the "Superpowers" and project standards.

## 3. Proposed Changes

### 3.1. `design-compliance/SKILL.md`
- **Frontmatter**: `description: Use when verifying that implementation matches ICONIX design and ADRs.`
- **Content**: Include Triggering Symptoms (feature start, design inconsistency), Core Patterns (Spec -> ADR Check), and Quick Reference for design documents.

### 3.2. `ui-engine-standard/SKILL.md`
- **Frontmatter**: `description: Use when building the "Magic Desk" UI using tokens, Glassmorphism, and Framer Motion.`
- **Content**: Include Triggering Symptoms (UI flat/inconsistent, starting React component), Core Patterns (Token Usage -> Animation Physics), and Quick Reference for design tokens.

### 3.3. `.agent/rules/ddd-enforcement.md`
- **Goal**: Strictly enforce DDD layer isolation and Dependency Injection (DI).
- **Rules**: Domain independence, DI for infrastructure, and clear layer isolation (Application -> Domain <- Infrastructure).

## 4. Implementation Plan
1. Create directories `.agent/skills/design-compliance` and `.agent/skills/ui-engine-standard`.
2. Create `SKILL.md` files for both new skills.
3. Create `.agent/rules/ddd-enforcement.md` with the approved rules.
4. Commit all changes following project standards.

## 5. Verification Strategy
- Manually review `SKILL.md` and rule files for compliance.
- Verify that the DDD enforcement rule accurately reflects the directory structure.
