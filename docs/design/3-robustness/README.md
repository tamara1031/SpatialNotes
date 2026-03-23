# Robustness Analysis

The robustness analysis bridges the gap between **Use Cases** (Requirements) and the **Detailed Design** (Classes and Sequences).

## 1. Principles
- **Control-to-Control Flow**: Strict adherence to ICONIX principles where controllers initiate logic and entities remain passive.
- **System Boundary**: The Boundary objects represent the user interface and system interface (SyncGateway).
- **Passive Entities**: Entity objects are strictly data containers and never initiate calls to Controls or Boundaries.

## 2. Diagrams
The following robustness diagrams define the core interactions:

- [UC1: Real-time Sync](./uc1-sync.puml)
- [UC2: Gesture Erasure](./uc2-erasure.puml)
- [UC3: Rich Elements](./uc3-rich-elements.puml)
- [UC4: Absolute Size Export](./uc4-absolute-size-export.puml)
- [UC5: Hierarchical Management](./uc5-hierarchy.puml)
- [UC6: Node Lifecycle](./uc6-lifecycle.puml)
- [UC7: Local Undo/Redo](./uc7-undo.puml)
- [UC8: Notifications](./uc8-notifications.puml)
- [UC10: Unlock Vault](./uc10-vault-auth.puml)
- [UC12: Markdown WYSIWYG](./uc12-markdown-wysiwyg.puml)
- [UC13: Notebook Engine Selection](./uc13-markdown-notebook-creation.puml)
- [UC14: Note Encryption Toggle](./uc14-note-encryption-toggle.puml)
- [UC15: Stylus Optimization](./uc15-stylus-optimization.puml)
- [UC16: Metadata Content Separation](./uc16-metadata-content-separation.puml)
- [UC17: Landing Page](./uc17-landing-page.puml)
- [UC18: User Sign-Up](./uc18-user-signup.puml)
- [UC19: User Sign-In](./uc19-user-signin.puml)
