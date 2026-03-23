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
