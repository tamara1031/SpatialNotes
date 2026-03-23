# ADR-002: Polymorphic Unified Node Model

## Context
Handling different node types (Folder, Notebook, Page, Element) with `if/else` or `switch(type)` branching in the domain logic leads to "Type Tagging" anti-patterns and fragile code.

## Decision
We use a **Polymorphic Class Hierarchy** in the Domain Layer:
1.  All types inherit from an abstract `Node` base class.
2.  Specific behaviors are implemented in subclasses (`ChapterNode`, `NotebookNode`, etc.).
3.  A **NodeFactory** in the persistence/infrastructure layer maps DB strings to these concrete classes.

## Status
Accepted

## Consequences
- **Positive**: Type-safe domain logic; clean adherence to Open-Closed Principle; branching is encapsulated in the factory.
- **Negative**: Adds class hierarchy overhead; requires a mapping layer from DB strings to classes.
