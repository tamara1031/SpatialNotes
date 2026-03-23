# ADR-016: Project Directory Structure (Monorepo + DDD)

## Status
Accepted

## Context
As the project grows with multiple UI frameworks (Astro/React), backends (Go), and shared libraries, we need a structure that ensures scalability, testability, and clear separation of concerns.

## Decision
SpatialNotes uses a **Monorepo** structure with **Domain-Driven Design (DDD)** principles. Web-specific libraries are co-located within the `apps/web` workspace to clarify their purpose.

```text
spatial-notes/
├── apps/
│   ├── web/                 # Astro Frontend (Island Architecture): The "UI Shell"
│   │   └── src/             # Frontend UI Application
│   │
│   └── server/              # Go Backend (DIP Layout)
│       ├── cmd/             # Binary entry points
│       ├── internal/        # Private application code
│       │   ├── application/ # HTTP Handlers & Service Interfaces
│       │   ├── service/     # Service Impls, Repository Interfaces, & Entities
│       │   ├── repository/  # Repository Implementations (SQL)
│       │   └── infrastructure/ # Clients (SQLite, Storage)
│       └── pkg/             # Publicly reusable Go packages
```

├── packages/                # Shared Libraries (Internal Workspace)
│   ├── core/                # Shared Domain logic and Types (TS)
│   ├── canvas-engine/       # High-level Engine Adapter (TS)
│   └── canvas-wasm/         # Performance-critical Rust Engine (Wasm)
│
├── docs/                    # ICONIX Design Docs & ADRs
└── tests/                   # Cross-functional E2E tests (Playwright)
```

## 1. Architectural Layers

### A. The UI Shell (`apps/web/src`)
- **Role**: Presentation and interaction logic using Astro and React Islands.

### B. Shared Packages (`packages/*`)
- **Role**: The brain of the application. 
- **Internal Monorepo**: These are managed as pnpm workspace members.
- **core**: Pure domain logic and shared types.
- **canvas-engine**: Encapsulates all drawing, interaction, and rendering logic. Plug-and-play.
- **canvas-wasm**: Performance-critical math logic in Rust.

### C. The Infrastructure Layer (`apps/server`)
- **Role**: Backend services for persistence and sync.

## 2. Rationale for Reorganization
- **Scalability**: Top-level `packages/` allows these libraries to be used by ANY app in the workspace (Web, Desktop, etc.).
- **Encapsulation**: `canvas-engine` is now fully self-contained, handling its own event loop and rendering.
