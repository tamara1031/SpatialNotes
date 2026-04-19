/**
 * Barrel for the modular store layout (see ADR-050).
 *
 * New code should import directly from the specialized modules under
 * `store/auth`, `store/vault`, and `store/sync`. This barrel is preserved for
 * backwards compatibility with existing call sites and tests.
 */

export * from "./auth/auth.actions";
export * from "./auth/auth.bootstrap";
export { authService } from "./auth/auth.service";
export * from "./auth/auth.session";
export { domainSyncService } from "./sync/SyncService";
export * from "./vault/vault.store";
export * from "./vault/vault.store.base";
