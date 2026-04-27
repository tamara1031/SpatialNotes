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
// Empty user ids are still stored verbatim — callers that want to reject
// them should validate before calling.
func With(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// UserID extracts the authenticated user id from ctx. The boolean is true
// if a non-empty id was present. Service-layer code typically wraps the
// false case in a sentinel error so the wire layer can map it to 401.
func UserID(ctx context.Context) (string, bool) {
	uid, ok := ctx.Value(userIDKey).(string)
	if !ok || uid == "" {
		return "", false
	}
	return uid, true
}
