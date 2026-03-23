# ADR-004: Application-Level Referential Integrity

## Context
SpatialNotes aims to be compatible with multiple relational databases (SQLite, MySQL, PostgreSQL) and potentially NoSQL-ish environments for sync. Database-level Foreign Keys can make migrations and multi-platform support complex.

## Decision
We will **not use database-level Foreign Keys**:
1.  All referential integrity (checking if a parent exists, cascading deletes) is handled by the **Domain/Application Layer**.
2.  The database layer only stores relationships as standard ID strings.

## Status
Accepted

## Consequences
- **Positive**: Easier multi-DB support; simpler data migrations/sync logic; DB engine independence.
- **Negative**: Risk of "orphaned records" if application bugs occur; no DB-level performance optimizations for cascading.
