# ADR-010: Behavioral & Testing Architecture (AI-Driven TDD)

## Context
We need a development workflow that leverages AI (the agent) while maintaining professional quality and easy contribution. We combine **Specification-Driven Use Cases**, **Test-Driven Quality Gates**, and **DDD Layering**.

## Decision

### 1. Specification-Driven (The "What")
Implementation starts from the **Use Case** defined in ICONIX Step 2. Each Use Case corresponds to an **Application Service** method (e.g., `NodeService.moveNode()`).

### 2. Test-First Implementation (The "Quality Gate")
- **The AI Workflow**: Before implementing any domain or application logic, I (the agent) will write a **Behavioral Test**.
- **No Heavy Mocks**: We prefer **Fake Objects** (In-memory implementations) over Mocks to ensure tests remain readable and reflect the cumulative state of the system.
- **Dependency Injection (DI)**: Classes must accept their dependencies (Repositories, Sync Managers) in constructors to facilitate testing with Fakes.

### 3. DDD-Aligned Testing
- **Domain Tests**: Focus on the logic of the `Node` and its subclasses (e.g., "A folder cannot be moved into its own subfolder").
- **Application Tests**: Focus on Use Case coordination (e.g., "Moving a node triggers a sync broadcast").
- **Infrastructure Tests**: Focus on DB/WebSocket persistence (e.g., "SQLite repository correctly marshals JSON elements").

### 3. Verification Strategy

#### A. Zero Hallucination Policy
Every new piece of domain logic **must** have a corresponding unit or behavioral test. Code without verification is considered "hallucinated" and not production-ready.

#### B. The Verification Loop (TDD Guide)
1. **Specification**: Review the Use Case.
2. **Contract**: Define the interface in the Domain layer.
3. **Fake**: Create/Update a "Fake" (In-memory) implementation.
4. **Test & Implement**: Red-Green-Refactor cycle.

#### C. Behavioral Focus
Tests should verify *what* the system does from a user's perspective, not *how* it's implemented internally.

## Status
Accepted

## Consequences
- **Positive**: High reliability; tests act as living documentation; AI-implementation errors are caught immediately by the gate.
- **Negative**: Initial development overhead for writing Fakes; requires strict discipline in DI usage.
