package application

import (
	"errors"
	"net/http"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/tamara1031/spatial-notes/apps/server/pkg/logger"
)

// writeServiceError maps a service-layer sentinel error to an HTTP response.
// It is the single place that owns the contract between domain errors and
// HTTP statuses, so handlers do not have to repeat the mapping at every
// call site (and so a future addition of a sentinel cannot silently end up
// as a generic 500 because one handler forgot to handle it).
//
// Unknown errors fall through to 500 and are logged with the supplied
// context so we can spot missing mappings without leaking internal details
// to the client.
func writeServiceError(w http.ResponseWriter, err error, op string, attrs ...any) {
	switch {
	case errors.Is(err, service.ErrUnauthenticated):
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	case errors.Is(err, service.ErrForbidden):
		http.Error(w, "Forbidden", http.StatusForbidden)
	case errors.Is(err, service.ErrNodeNotFound):
		http.Error(w, "Not found", http.StatusNotFound)
	case errors.Is(err, service.ErrCircularRef):
		http.Error(w, "Bad request: would create cycle", http.StatusBadRequest)
	case errors.Is(err, service.ErrUserNotFound):
		http.Error(w, "Not found", http.StatusNotFound)
	case errors.Is(err, service.ErrUserAlreadyExists):
		http.Error(w, "Conflict", http.StatusConflict)
	case errors.Is(err, service.ErrInvalidToken), errors.Is(err, service.ErrUnauthorized):
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	default:
		// Unknown error: log with context for debugging, but only return a
		// generic message so we don't leak internals to the caller.
		args := append([]any{"op", op, "error", err}, attrs...)
		logger.Error("unhandled service error", args...)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}
