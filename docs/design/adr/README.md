# Architecture Decision Records (ADR)

This index provides a high-level summary of the architectural decisions for **SpatialNotes**. Each decision is documented in detail within its respective file.

---

## Master ADR Table

| ID | Category | Decision / Title | Summary / Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **001** | Persistence | [Hybrid Partition Model](./001-hybrid-partition-model.md) | Separates metadata from bulk drawing data for performance. | Accepted |
| **002** | Domain | [Polymorphic Node Model](./002-polymorphic-node-model.md) | Single-table inheritance for Folder/Notebook nodes. | Accepted |
| **003** | Engine | [Absolute Size Canvas](./003-absolute-size-canvas.md) | Fixed B5/A4 physical dimensions for consistency. | Accepted |
| **004** | Domain | [App-Level Integrity](./004-application-level-integrity.md) | Relocating database constraints to the application layer. | Accepted |
| **005** | Domain | [Visitor Pattern](./005-visitor-pattern-processing.md) | Decoupling element processing from data structures. | Accepted |
| **006** | Product | [Markdown/LaTeX Support](./006-markdown-latex-support.md) | Rich text and mathematical notation on the spatial canvas. | Accepted |
| **007** | Quality | [Spatial Hashing](./007-spatial-hashing-performance.md) | Grid-based indexing for O(1) hit-testing. | Accepted |
| **008** | Quality | [Integrated Stack Testing](./008-integrated-stack-testing.md) | Hybrid testing strategy including Fakes and Playwright. | Accepted |
| **010** | Quality | [Behavioral Testing](./010-behavioral-testing-architecture.md) | Focus on user behaviors with Zero Hallucination Policy. | Accepted |
| **011** | Engine | [Native Clipboard](./011-native-clipboard-format.md) | Using `application/x-spatialnote+json` for cross-workspace copy. | Accepted |
| **012** | Persistence | [Database Abstraction](./012-database-abstraction.md) | Interface-based persistence for engine swappability. | Accepted |
| **013** | Infra | [Pluggable Infrastructure](./013-pluggable-infrastructure.md) | Decoupling external services (Auth, Storage) from logic. | Accepted |
| **014** | Persistence | [MVP Concurrency](./014-mvp-concurrency-undo.md) | Initial "Last-Write-Wins" strategy for basic sync. | Accepted |
| **015** | Engine | [Eraser Behavior](./015-eraser-behavior-strategy.md) | Support for Precision vs Whole-stroke erasure. | Accepted |
| **016** | Structure | [Monorepo Structure](./016-directory-structure-refactoring.md) | Standardized `apps/` and `packages/` layout. | Accepted |
| **017** | Persistence | [Local-First Strategy](./017-local-first-persistence-strategy.md) | Offline-first approach using IndexedDB before sync. | Accepted |
| **018** | Engine | [Millimeter Coordinates](./018-millimeter-coordinate-system.md) | Global `mm` units to maintain physical scale. | Accepted |
| **019** | Persistence | [Yjs + WebSocket Sync](./019-sync-protocol-yjs-websocket.md) | Conflict-free synchronization using CRDTs. | Accepted |
| **020** | Infra | [Astro-Wasm Architecture](./020-astro-wasm-island-architecture.md) | Serving Rust/Wasm through Astro Islands. | Accepted |
| **021** | Engine | [Full Rust Ink Engine](./021-full-rust-ink-engine.md) | Mathematical core in Rust/Wasm for low latency. | Accepted |
| **022** | Infra | [Cross-Island Notification](./022-cross-island-notification-pattern.md) | Event-bus communication between Astro islands. | Accepted |
| **023** | Infra | [Structured Logging](./023-structured-logging-strategy.md) | Uniform JSON logging across all stacks. | Accepted |
| **024** | Engine | [Plug-and-Play Engine](./024-plug-and-play-engine-architecture.md) | Standardized interface for swappable drawing engines. | Accepted |
| **025** | Engine | [Isolated Engine State](./025-isolated-engine-state-management.md) | Engines manage their own high-frequency state. | Accepted |
| **026** | Engine | [Spatial Selection](./026-spatial-selection-and-clipboard.md) | Bounding-box and proximity-based element selection. | Accepted |
| **027** | Engine | [Unified Undo Strategy](./027-unified-undo-strategy.md) | Bridging Canvas and Shell state for atomic undo. | Accepted |
| **028** | Persistence | [Materialization API](./028-materialization-api.md) | Efficient reassembly of partitioned notebook data. | Accepted |
| **029** | Engine | [Tool Strategy Pattern](./029-tool-strategy-and-unified-interaction.md) | Decoupling interaction logic into swappable Tools. | Accepted |
| **030** | Engine | [Multi-Engine Architecture](./030-single-user-multi-engine-architecture.md) | Support for Canvas and Markdown engines in one session. | Accepted |
| **031** | Domain | [Flattened Hierarchy](./031-flattened-hierarchy.md) | Nesting limits to optimize performance and UX. | Accepted |
| **032** | Persistence | [Debounced Cloud Sync](./032-debounced-periodic-sync.md) | Manual/Auto sync with clear UI status indicators. | Accepted |
| **039** | Persistence | [<s>Local-First E2EE</s>](./039-local-first-e2ee.md) | (Superseded by ADR-045) | Superseded |
| **043** | Domain | [<s>User Management</s>](./043-user-management-and-vault-setup.md) | (Superseded by ADR-045) | Superseded |
| **045** | Persistence | [Zero-Knowledge E2EE](./045-zero-knowledge-e2ee-vault-architecture.md) | Refined E2EE with client-side key wrapping and zero-knowledge server. | Accepted |
| **046** | Security | [Hybrid Encryption Strategy](./046-hybrid-encryption-strategy.md) | User-selectable encryption (Standard vs E2EE) at note level. | Proposed |
| **033** | Structure | [3-Stack Synergy](./033-core-technology-stack.md) | Go (Infra) + Astro (Shell) + Rust/Wasm (Engine). | Accepted |

| **034** | Domain | [Unified Domain Mirroring](./034-unified-domain-logic-mirroring.md) | Synchronized business rules between TS and Go. | Accepted |
| **035** | Quality | [Latency Budgets](./035-performance-and-latency-budgets.md) | Strict sub-16ms targets for interactive feedback. | Accepted |
| **036** | Structure | [Development Standards](./036-development-standards.md) | Enforcing DRY and strict package encapsulation. | Accepted |
| **037** | UI | [UI Visual Identity](./037-ui-visual-identity.md) | Glassmorphism, design tokens, and premium aesthetics. | Accepted |
| **038** | Engine | [Infinite Canvas](./038-infinite-canvas-and-smart-pagination.md) | Boundless brainstorming with Smart PDF Fitting. | Accepted |
| **040** | Infra | [Compression Strategy](./040-data-compression-strategy.md) | Client-side pre-encryption compression and server Gzip. | Accepted |
| **041** | Engine | [Off-Main-Thread Rendering](./041-off-main-thread-rendering.md) | Moving WASM/WebGPU to WebWorkers for zero-latency UI. | Accepted |
| **047** | Infra | [Landing Page Route Separation](./047-landing-page-route-separation.md) | Splitting landing page from vault app for better performance. | Accepted |
| **048** | Domain | [Domain Event System](./048-domain-event-system.md) | Decoupled event-driven architecture for node lifecycle. | Accepted |
| **049** | Application | [Command Storage Abstraction](./049-command-storage-abstraction.md) | Decoupling application commands from CRDT/Storage implementation. | Accepted |
| **050** | UI | [Modular Web Store](./050-modular-web-store.md) | Breaking down monolithic store into maintainable modules. | Accepted |

---

> [!TIP]
> This table serves as the primary map for architectural decisions. For a high-level conceptual walk-through, please refer to the [Architecture Overview](../0-requirements/architecture-overview.md).
