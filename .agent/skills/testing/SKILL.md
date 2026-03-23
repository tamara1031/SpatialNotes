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
