package application

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

func TestRequireNodeID_ReturnsFalseAnd400WhenMissing(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/nodes//updates", nil)
	// PathValue("id") on this raw request is empty because the request did
	// not pass through a router — that is exactly the "route did not
	// capture an id" failure mode the helper must guard against.

	id, ok := requireNodeID(rec, req)
	if ok || id != "" {
		t.Fatalf("expected (\"\", false) on missing id, got (%q, %v)", id, ok)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestRequireNodeID_PassesThroughWhenRouterCaptures(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/nodes/abc/updates", nil)
	req.SetPathValue("id", "abc")

	id, ok := requireNodeID(rec, req)
	if !ok || id != "abc" {
		t.Fatalf("expected (\"abc\", true), got (%q, %v)", id, ok)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected no early write, got status %d", rec.Code)
	}
}

// TestWriteServiceError pins the sentinel-to-HTTP-status contract that the
// rest of the application layer relies on. If a new domain sentinel is added
// without a mapping, the default branch is exercised here so the gap shows
// up as a 500 rather than as a silent regression.
func TestWriteServiceError(t *testing.T) {
	cases := []struct {
		name       string
		err        error
		wantStatus int
	}{
		{"unauthenticated", service.ErrUnauthenticated, http.StatusUnauthorized},
		{"forbidden", service.ErrForbidden, http.StatusForbidden},
		{"node not found", service.ErrNodeNotFound, http.StatusNotFound},
		{"circular reference", service.ErrCircularRef, http.StatusBadRequest},
		{"user not found", service.ErrUserNotFound, http.StatusNotFound},
		{"user already exists", service.ErrUserAlreadyExists, http.StatusConflict},
		{"invalid token", service.ErrInvalidToken, http.StatusUnauthorized},
		{"unauthorized", service.ErrUnauthorized, http.StatusUnauthorized},
		{"unknown error falls through to 500", errors.New("boom"), http.StatusInternalServerError},
		{"wrapped sentinel still maps", fmt.Errorf("upstream: %w", service.ErrForbidden), http.StatusForbidden},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			writeServiceError(rec, tc.err, "test_op")
			if rec.Code != tc.wantStatus {
				t.Errorf("got status %d, want %d", rec.Code, tc.wantStatus)
			}
		})
	}
}
