package service

import "errors"

// Domain-level sentinel errors. Callers (handlers, tests) must match these
// with errors.Is rather than scraping error messages, so wording can evolve
// without silently breaking HTTP mappings or behavioural tests.
//
// Every sentinel must have a corresponding case in application/httperr.go.
// Errors that don't belong to a specific domain category (unexpected DB
// failures, I/O errors, etc.) must be wrapped with ErrInternal so they map
// to 500 explicitly rather than falling through the default branch silently.
var (
	// --- Node domain ---

	// ErrNodeNotFound indicates the requested node does not exist or is not
	// visible to the caller's user id.
	ErrNodeNotFound = errors.New("node not found")

	// ErrCircularRef indicates a tree mutation that would form a cycle
	// (moving a node into itself or one of its descendants).
	ErrCircularRef = errors.New("circular reference detected")

	// --- Auth/identity domain ---

	// ErrUserNotFound indicates no user record matches the lookup key.
	ErrUserNotFound = errors.New("user not found")

	// ErrUserAlreadyExists indicates a registration attempt for an email
	// that is already taken.
	ErrUserAlreadyExists = errors.New("user already exists")

	// ErrInvalidToken indicates a JWT that cannot be parsed, has an
	// unexpected signing method, is expired, or has malformed claims.
	ErrInvalidToken = errors.New("invalid token")

	// ErrUnauthorized indicates valid credentials were required but not
	// supplied (e.g. wrong password during login).
	ErrUnauthorized = errors.New("unauthorized")

	// --- Cross-cutting ---

	// ErrUnauthenticated indicates no user id was attached to the context.
	// This is distinct from ErrForbidden (caller is known but not allowed)
	// and from ErrUnauthorized (wrong credentials were supplied).
	ErrUnauthenticated = errors.New("unauthenticated: user id not in context")

	// ErrForbidden indicates the authenticated caller does not own (or is
	// otherwise not allowed to operate on) the target resource. It MUST be
	// returned before any side effects of the request take place.
	ErrForbidden = errors.New("forbidden: user does not own this resource")

	// ErrInternal wraps unexpected infrastructure failures (DB I/O errors,
	// storage errors) that are not part of the domain model. Wrapping with
	// this sentinel lets httperr.go map them to 500 explicitly and log the
	// root cause, rather than relying on the silent default branch.
	ErrInternal = errors.New("internal error")
)
