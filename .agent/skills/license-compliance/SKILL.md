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
