# Design Spec: Security and Compliance Skills

## 1. Problem Statement
The current agent skills in `.agent/skills/` are focused on basic codebase analysis, quality gating (lint/format), and testing. There is a need for specialized skills to address security vulnerabilities, hardcoded secrets, and license compliance (specifically copyleft licenses like GPL/AGPL).

## 2. Goals
- Add two new specialized skills to the `.agent/skills/` directory: `security-audit` and `license-compliance`.
- Align these skills with the "Superpowers" standard (`writing-skills`) including symptom-based descriptions, quick references, and common mistakes.
- Integrate tool-based audit commands for both Go and TypeScript environments.

## 3. Proposed Changes

### 3.1. `security-audit/SKILL.md`
- **Frontmatter**: `description: Use when checking for vulnerabilities and hardcoded secrets.`
- **Content**: Include sections for Triggering Symptoms (hardcoded keys, SQLi/XSS patterns), Core Patterns (Secret Scan -> Vuln Check), and Quick Reference for tools like `gitleaks`, `govulncheck`, and `pnpm audit`.

### 3.2. `license-compliance/SKILL.md`
- **Frontmatter**: `description: Use when checking for copyleft licenses and legal compliance.`
- **Content**: Include sections for Triggering Symptoms (adding new deps, GPL viral effects), Core Patterns (Dependency Scan -> License Audit), and Quick Reference for tools like `pnpm licenses` and `go-licence-detector`.

## 4. Implementation Plan
1. Create the directories `.agent/skills/security-audit` and `.agent/skills/license-compliance`.
2. Create the `SKILL.md` files with the approved content.
3. Commit the changes following the project's commit standards.

## 5. Verification Strategy
- Manually review each `SKILL.md` for compliance with the `writing-skills` standard.
- Verify that the tool commands align with the project's tech stack (Go, TypeScript/pnpm).
