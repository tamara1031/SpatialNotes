# Detailed Design

Detailed design artifacts translate robustness diagrams into implementation-ready class and sequence diagrams, and provide comprehensive documentation for each core domain.

## 1. Core Domain Detailed Design

- [**Canvas Engine**](./canvas-engine.md): Infinite canvas, Rust/Wasm core, spatial hashing, and stroke lifecycle.
- [**Markdown Engine**](./markdown-engine.md): WYSIWYG editing, GFM support, KaTeX integration, and Yjs block-based sync.
- [**Authentication & E2EE**](./auth-e2ee.md): Zero-Knowledge Vault, key derivation, hybrid encryption, and secure signup/signin.
- [**Synchronization & Persistence**](./sync-persistence.md): Yjs synchronization, local-first (IndexedDB), and debounced sync logic.

## 2. Domain Models & Technical Notes

- [Nodes Domain](./nodes-domain.md)
- [Auth Domain](./auth-domain.md)
- [Vault Domain](./vault-domain.md)
- [Authentication Flow V2 Summary](./auth-flow-v2.md)

## 3. Sequence & Interaction Diagrams

- [UC1: Real-time Sync](./uc1-sync.puml)
- [UC2: Gesture Erasure](./uc2-erasure.puml)
- [UC3: Rich Elements Interaction](./uc3-rich-elements.puml)
- [UC4: Absolute Size Export](./uc4-export.puml)
- [UC5: Hierarchical Management](./uc5-hierarchy.puml)
- [UC6: Node Lifecycle](./uc6-lifecycle.puml)
- [UC7: Command Dispatch](./uc7-command-sequence.puml)
- [UC8: Notifications](./uc8-notification-sequence.puml)
- [UC10: Unlock Vault](./uc10-unlock-vault-sequence.puml)
- [UC12: Markdown WYSIWYG Editor](./uc12-markdown-wysiwyg-editor-sequence.puml)
- [Auth: Step-by-Step Sign In](./auth-signin-sequence.puml)
- [Auth: Login Success & Redirect](./auth-login-success-sequence.puml)
- [Engine: Low-level Engine Interaction](./engine-interaction-sequence.puml)

## 4. Class Diagrams

- [Unified Class Diagram](./unified-class-diagram.puml)
