package application

import (
	"encoding/json"
	"net/http"
)

// decodeJSON reads r.Body and unmarshals it into v. On failure it writes a
// 400 Bad Request and returns false; the caller should return immediately.
//
// Centralising this stops two subtle drifts that the per-handler decoders
// had: HandleRegister/HandleLogin echoed the raw json error message back
// to the client (a small information leak about request shape), while the
// node handlers used the safer fixed string. With one helper, every
// endpoint produces the same opaque "Invalid request body" message.
func decodeJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return false
	}
	return true
}

// validateRequest calls v.validate() and writes a 400 Bad Request when
// validation fails. Use this after decodeJSON for request-level field checks
// (missing required fields, invalid format) that should signal 400 rather
// than the 422 the service layer produces for domain invariant violations.
// Returns true when the request is valid and the handler may proceed.
func validateRequest(w http.ResponseWriter, v interface{ validate() error }) bool {
	if err := v.validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return false
	}
	return true
}
