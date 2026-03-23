# SpatialNotes: Go Backend Rules
# applyTo: server/**/*.go

## Architecture: DIP Layout
- **Service Layer (`internal/service`)**: Pure logic, Entities, and Repository Interfaces.
- **Application Layer (`internal/application`)**: HTTP handlers, DTOs, and Service Interfaces.
- **Repository Layer (`internal/repository`)**: SQL implementations using Bun.
- **Infrastructure (`internal/infrastructure`)**: Database initialization (`db.go`), Blob Storage.

## Implementation Standards
- **Strategy Pattern (DB Client)**: The database infrastructure is absorbed into generic Bun-based logic. Avoid engine-specific directories (e.g., no `sqlite/` directory). Use `infrastructure.NewDB` to swap dialects.
- **Per-Entity Repositories**: Split repository implementations by domain aggregate (e.g., `NodeRepository`, `EncryptedUpdateRepository`).
- **Automatic Schema**: Use Bun's model-based schema creation in `infrastructure.CreateSchema` instead of manual SQL migrations.

## Data Processing
- **Compression**: All high-volume binary data (Updates, Blobs) should be processed (compressed/resized) on the client BEFORE reaching the backend.
- **Zero-Knowledge**: The backend acts as an opaque relay for encrypted payloads. Do not attempt to parse encrypted fields.

## Testing Pattern
- **Unit (Service)**: Use **High-performance Fakes** (in-memory maps) defined within the `service` package. Avoid database dependencies in service tests.
- **Integration (Repository)**: Use SQLite `:memory:` for verifying SQL implementations in the `repository` package.
- **Table-driven tests**: Preferred for logic and handler verification.
