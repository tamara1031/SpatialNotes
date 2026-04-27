package service

import "errors"

// Domain-level sentinel errors for the node service. Callers (handlers,
// tests) should match these with errors.Is rather than scraping the error
// message, so the wording of an error can evolve without silently breaking
// behavioural tests or HTTP error mapping.
var (
	// ErrNodeNotFound indicates the requested node does not exist or is not
	// visible to the caller's user id.
	ErrNodeNotFound = errors.New("node not found")

	// ErrCircularRef indicates a tree mutation that would form a cycle
	// (moving a node into itself or one of its descendants).
	ErrCircularRef = errors.New("circular reference detected")

	// ErrUnauthenticated indicates no user id was attached to the context.
	// This is distinct from ErrForbidden, which means the caller is known
	// but not allowed to perform the operation on the target resource.
	ErrUnauthenticated = errors.New("unauthenticated: user id not in context")

	// ErrForbidden indicates the authenticated caller does not own (or is
	// otherwise not allowed to operate on) the target resource. It MUST be
	// returned before any side effects of the request take place.
	ErrForbidden = errors.New("forbidden: user does not own this resource")
)
