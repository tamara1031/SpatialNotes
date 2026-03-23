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
