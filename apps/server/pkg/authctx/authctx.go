// Package authctx owns the convention for carrying an authenticated user
// id on a request context. It sits below both the application (HTTP)
// layer and the service (domain) layer so that neither has to depend on
// the other just to share a context key — the previous arrangement, in
// which the key lived in service/ but was set by HTTP middleware, mixed
// concerns and forced every consumer to import service.
package authctx

import "context"

// contextKey is unexported so callers cannot collide with this key by
// constructing one of the same string value from the outside.
type contextKey string

const userIDKey contextKey = "user_id"

// With returns a new context that carries the given authenticated user id.
// Empty user ids are stored verbatim — UserID will report them as absent
// on the way out. The asymmetry is deliberate: it lets a writer that has
// no opinion (e.g. a generic test helper) round-trip through this package
// without first knowing the "empty == absent" rule, while readers always
// see a single canonical "missing identity" signal.
//
// If a future feature needs to model an explicit anonymous user (a real
// principal that is just not authenticated), the right move is to add a
// separate API like WithAnonymous + IsAnonymous rather than to change
// the empty-string semantics here, which is currently relied on by every
// auth gate in the service layer.
func With(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// UserID extracts the authenticated user id from ctx. The boolean is true
// only if a non-empty id was present; an empty string stored under the
// key is reported as absent so middleware that forgets to populate the
// value cannot fool service-layer auth gates. Service-layer code wraps
// the false case in ErrUnauthenticated so the wire layer maps it to 401.
func UserID(ctx context.Context) (string, bool) {
	uid, ok := ctx.Value(userIDKey).(string)
	if !ok || uid == "" {
		return "", false
	}
	return uid, true
}
