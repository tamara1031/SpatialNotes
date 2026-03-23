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
