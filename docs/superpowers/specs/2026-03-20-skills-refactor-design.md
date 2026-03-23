# Design Spec: Skills Refactor

## 1. Problem Statement
The current agent skills in `.agent/skills/` follow a basic structure that lacks the rigor, searchability, and diagnostic features (symptoms, common mistakes) of the "Superpowers" standard. This makes them less effective for automated discovery and consistent application.

## 2. Goals
- Align all skills in `.agent/skills/` with the `writing-skills` standard.
- Improve skill discovery via optimized "Use when..." descriptions.
- Enhance skill effectiveness by adding "Common Mistakes" and "Quick Reference" sections.
- Ensure token efficiency for all refactored skills.

## 3. Proposed Changes

### 3.1. `codebase-analysis/SKILL.md`
- **Frontmatter**: Update `description` to "Use when performing deep structural analysis and semantic search across the project."
- **Sections**: Add `When to Use` (with triggering symptoms), `Quick Reference` (with markdown table), and `Common Mistakes`.

### 3.2. `quality-gate/SKILL.md`
- **Frontmatter**: Update `description` to "Use when maintaining code standards using Lint, Format, and Tidy."
- **Sections**: Add `When to Use` (with triggering symptoms), `Quick Reference` (with markdown table), and `Common Mistakes`.

### 3.3. `testing/SKILL.md`
- **Frontmatter**: Update `description` to "Use when executing and automatically fix tests for Go and TypeScript."
- **Sections**: Add `When to Use` (with triggering symptoms), `Quick Reference` (with markdown table), and `Common Mistakes`.

## 4. Implementation Plan
1. Update each `SKILL.md` file with the approved content.
2. Verify that the YAML frontmatter and Markdown structure are valid.
3. Commit the changes following the project's commit standards.

## 5. Verification Strategy
- Manually review each `SKILL.md` for compliance with the `writing-skills` standard.
- Use `grep` or similar to verify the frontmatter is correctly formatted for search.
