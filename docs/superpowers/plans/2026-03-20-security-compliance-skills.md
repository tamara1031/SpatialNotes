# Security and Compliance Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement specialized skills for security auditing and license compliance.

**Architecture:** Creation of new skill directories and `SKILL.md` files following the Superpowers standard.

**Tech Stack:** Markdown, YAML.

---

### Task 1: Implement security-audit skill

**Files:**
- Create: `.agent/skills/security-audit/SKILL.md`

- [ ] **Step 1: Create directory**

Run: `mkdir -p .agent/skills/security-audit`

- [ ] **Step 2: Create SKILL.md**

```markdown
---
name: security-audit
description: Use when checking for vulnerabilities and hardcoded secrets.
---

# Security Audit

## Overview
Perform automated security checks to identify hardcoded secrets and known vulnerabilities in Go and TypeScript.

## When to Use
- **Triggering Symptoms**: 
  - "About to commit code"
  - "I'm worried about hardcoded keys"
  - "Need to check for SQLi or XSS patterns"
  - "Are there any CVEs in my dependencies?"
- **When NOT to use**: For general code style or linting issues (use `quality-gate` instead).

## Core Pattern: Secret Scan -> Vulnerability Check -> Pattern Match
Run security audits before any PR or merge to ensure compliance.

## Quick Reference
| Target | Tool | Command |
| --- | --- | --- |
| Secrets | `gitleaks` | `gitleaks detect --source . --verbose` |
| Go Vulns | `govulncheck` | `govulncheck ./...` |
| TS Vulns | `pnpm audit` | `pnpm audit` |
| Patterns | `grep` | `grep -r "eval(" .` or `grep -r "dangerouslySetInnerHTML" .` |

## Common Mistakes
- Committing `.env` files: Always verify `.gitignore`.
- Ignoring `pnpm audit` warnings: Even low-severity vulns can be chained.
```

- [ ] **Step 3: Verify structure**

Run: `ls .agent/skills/security-audit/SKILL.md`
Expected: File exists.

- [ ] **Step 4: Commit**

```bash
git add .agent/skills/security-audit/SKILL.md
git commit -m "feat(skills): add security-audit skill"
```

---

### Task 2: Implement license-compliance skill

**Files:**
- Create: `.agent/skills/license-compliance/SKILL.md`

- [ ] **Step 1: Create directory**

Run: `mkdir -p .agent/skills/license-compliance`

- [ ] **Step 2: Create SKILL.md**

```markdown
---
name: license-compliance
description: Use when checking for copyleft licenses and legal compliance.
---

# License Compliance

## Overview
Perform legal and architectural checks to identify copyleft (GPL, AGPL) or non-compliant licenses in the codebase.

## When to Use
- **Triggering Symptoms**: 
  - "Adding a new dependency"
  - "Need to verify our license policy"
  - "I'm worried about GPL viral effects"
  - "Wait, what's our license stack?"
- **When NOT to use**: For standard code style or dependency version issues.

## Core Pattern: Dependency Scan -> License Audit -> Compliance Report
Run license audits after adding new packages to ensure legal safety.

## Quick Reference
| Target | Tool | Command |
| --- | --- | --- |
| TS Licenses | `pnpm licenses` | `pnpm licenses list` |
| Go Licenses | `go-licence-detector` | `go-licence-detector ./...` |
| Manual Scan | `grep` | `grep -r "GPL" .` or `grep -r "AGPL" .` |

## Common Mistakes
- Not checking transitive dependencies: A MIT package might depend on a GPL one.
- Ignoring `LICENSE` files: Check for restrictive clauses.
```

- [ ] **Step 3: Verify structure**

Run: `ls .agent/skills/license-compliance/SKILL.md`
Expected: File exists.

- [ ] **Step 4: Commit**

```bash
git add .agent/skills/license-compliance/SKILL.md
git commit -m "feat(skills): add license-compliance skill"
```
