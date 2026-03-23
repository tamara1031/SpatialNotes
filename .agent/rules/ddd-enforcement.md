# DDD Layer Enforcement & Dependency Inversion (DIP)
# applyTo: server/internal/**, packages/core/**, apps/web/src/**

## 1. Internal Directory Layout (Go Backend)
We use a **Flattened DIP Layout** to minimize nesting while enforcing clear boundaries:
- **`internal/application/`**: HTTP Handlers, Controllers, and **Service Interfaces**.
- **`internal/service/`**: Domain Entities, Business Logic, and **Repository Interfaces**.
- **`internal/repository/`**: Persistence Implementations (SQL, Bun).
- **`internal/infrastructure/`**: Technology-specific clients (DB connection, Storage).

## 2. Dependency Inversion Principle (DIP)
1. **Handlers -> Service**: Handlers MUST NOT depend on concrete service implementations. They depend on interfaces defined in `internal/application/`.
2. **Services -> Repositories**: Services MUST NOT depend on concrete repository implementations. They depend on interfaces defined in `internal/service/`.
3. **Data Ownership**: Entities (Nodes, Updates) belong to the `service` package.

## 3. Layer Isolation Rules
- **Domain Independence**: The `service` package MUST NOT import from `application`, `repository`, or `infrastructure`.
- **Infrastructure Implementation**: Packages in `repository` and `infrastructure` MUST implement interfaces defined in the `service` package.
- **Factory Pattern**: Use a common entry point (`main.go`) to instantiate concrete implementations and inject them into higher-level services.

## 4. Verification
- **Import Check**: Run `grep -r "internal/repository" internal/service/` - Should be empty.
- **Testing**: Service-layer tests MUST use **Fake implementations** within the `service` package to ensure 100% decoupling from the database.
