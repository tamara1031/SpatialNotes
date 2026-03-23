# SpatialNotes Design Suite (ICONIX + DDD)

This directory contains the implementation-ready design for SpatialNotes. For a quick architectural overview, refer to the **[ADR Master Index](./adr/README.md)**.

## 🚀 The Design Flow

### [Phase 1: Architecture & Standards (ADRs)](./adr/)
- **Core Technology**: [3-Stack Synergy](./adr/033-core-technology-stack.md) (Go + Astro + Rust).
- **Project Structure**: [Monorepo Layout](./adr/016-directory-structure-refactoring.md).
- **Quality Gates**: [Testing Strategy](./adr/008-integrated-stack-testing.md) & [Behavioral Verification](./adr/010-behavioral-testing-architecture.md).
- **Visual Identity**: [Glassmorphism & Tokens](./adr/037-ui-visual-identity.md).

### [Phase 2: Domain & Use Case Modeling](./2-use-cases/)
- **Ubiquitous Language**: [1-Domain Analysis](./1-domain/ubiquitous-language.md)
- **Primary Use Cases**: [2-Use Case Index](./2-use-cases/)
- **Business Logic**: [Robustness Diagrams](./3-robustness/README.md)

### [Phase 3: Data & Detailed Design](./5-detailed-design/)
- **Data Architecture**: [Logical Data Model](./4-data-model/data-model.md)
- **Implementation Design**: [Detailed Design Index](./5-detailed-design/README.md)

---

## 🏗️ Architectural Decision Records (ADR)

All key architectural decisions are documented in the **[ADR Master Index](./adr/README.md)**.

### Categorized Quick Links:
- **Foundational**: [Monorepo Structure](./adr/016-directory-structure-refactoring.md), [3-Stack Synergy](./adr/033-core-technology-stack.md), [E2EE Architecture](./adr/039-local-first-e2ee.md).
- **Drawing Engine**: [Plug-and-Play Architecture](./adr/024-plug-and-play-engine-architecture.md), [Isolated State](./adr/025-isolated-engine-state-management.md), [Full Rust Ink Engine](./adr/021-full-rust-ink-engine.md).
- **Persistence & Sync**: [Local-First Strategy](./adr/017-local-first-persistence-strategy.md), [Yjs + WebSocket Sync](./adr/019-sync-protocol-yjs-websocket.md), [Debounced Cloud Sync](./adr/032-debounced-periodic-sync.md).
- **Domain Integrity**: [Unified Domain Mirroring](./adr/034-unified-domain-logic-mirroring.md), [Polymorphic Node Model](./adr/002-polymorphic-node-model.md).

---

## 🛠️ Coding & Quality Guidelines

**CRITICAL MANDATE**: 
To prevent regressions and maintain the integrity of the design architecture, the following rules apply:

1. **Test Execution**: Run `make test` for unit/integration tests and `make test-e2e` for Playwright before committing.
2. **Quality Gates**: Enforce strict alignment with [ADR-036: Development Standards](./adr/036-development-standards.md).
3. **Design Alignment**: Major changes to data flow MUST update related Use Cases and Sequence Diagrams.
