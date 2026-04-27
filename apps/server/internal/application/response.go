package application

import (
	"encoding/json"
	"net/http"

	"github.com/tamara1031/spatial-notes/apps/server/pkg/logger"
)

// writeJSON sets Content-Type, writes the status code, and encodes v as JSON.
// Encoding errors are logged because the status has already been sent and cannot be changed.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		logger.Error("JSON response encoding failed", "error", err)
	}
}
