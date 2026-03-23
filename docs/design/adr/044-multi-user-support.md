# ADR-044: Multi-User Support in MVP

## Status
Accepted

## Context
SpatialNotes was initially designed as a single-user system (ADR-030). However, the separation of identity and credentials (ADR-043) and the introduction of server-side salt storage highlighted the need for true multi-user support to enable proper cross-device synchronization and isolation between different users. Hardcoding a single "admin" user is an unnecessary limitation that would require significant refactoring later.

## Decision
We will promote Multi-User support to a core MVP feature. This involves:

1.  **Identity-Scoped Data**: All primary data entities (`notebook_nodes`, `node_updates`, `room_updates`) will include a `user_id` field.
2.  **Strict Isolation**: The backend will enforce data isolation by filtering all repository queries and materialization logic using the `user_id` extracted from the JWT token.
3.  **Refined Auth Flow (Email-First)**:
    -   To support multiple users, the client must first identify the user to retrieve their specific E2EE `vault_salt`.
    -   New flow:
        1.  User enters email.
        2.  Client queries `GET /api/auth/salt?email=...`.
        3.  If user exists, the server returns the salt, and the client prompts for the Master Password (Unlock).
        4.  If user does not exist, the client prompts for account creation (Setup/Register).
4.  **Registration and Login**:
    -   `POST /api/auth/register`: Creates a new User and their initial 'local' Authenticator.
    -   `POST /api/auth/login`: Verifies credentials and issues a JWT.

## Consequences

### Positive
-   **Security**: Clear data ownership and isolation.
-   **Scalability**: Ready for multi-tenant or multi-user deployments out of the box.
-   **Usability**: Users can create their own accounts instead of sharing a single "admin" password.

### Negative
-   Minor increase in complexity for E2E tests (must handle registration/login).
-   Need to ensure the `user_id` is indexed for performance.

## Implementation Details
-   `AuthMiddleware` will inject `user_id` into the request context.
-   `NodeService` will extract `user_id` from context and pass it to repositories.
-   `Repository` methods will include `userID` in their signatures and SQL `WHERE` clauses.
