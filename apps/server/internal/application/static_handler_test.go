package application

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func newTestSPAHandler(files fstest.MapFS) *SPAHandler {
	return NewSPAHandler(files, http.NewServeMux())
}

// TestSPAHandler_DirectoryRouteNoRedirectLoop is a regression test for the
// ERR_TOO_MANY_REDIRECTS bug: requesting /notes/ caused the handler to rewrite
// the URL to /notes/index.html, which http.FileServer then 301-redirected back
// to /notes/ — an infinite loop.
func TestSPAHandler_DirectoryRouteNoRedirectLoop(t *testing.T) {
	fs := fstest.MapFS{
		"index.html":       {Data: []byte("<html>root</html>")},
		"notes/index.html": {Data: []byte("<html>notes</html>")},
	}
	h := newTestSPAHandler(fs)

	// /notes/ (with trailing slash) must return 200 directly, not redirect.
	req := httptest.NewRequest(http.MethodGet, "/notes/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	res := rec.Result()
	if res.StatusCode != http.StatusOK {
		t.Errorf("GET /notes/: want 200, got %d (Location: %s)", res.StatusCode, res.Header.Get("Location"))
	}
}

// TestSPAHandler_DirectoryRouteCanonicalRedirect verifies that /notes (no
// trailing slash) gets a single canonical 301 to /notes/ — acceptable behavior,
// distinct from the infinite-loop bug.
func TestSPAHandler_DirectoryRouteCanonicalRedirect(t *testing.T) {
	fs := fstest.MapFS{
		"index.html":       {Data: []byte("<html>root</html>")},
		"notes/index.html": {Data: []byte("<html>notes</html>")},
	}
	h := newTestSPAHandler(fs)

	req := httptest.NewRequest(http.MethodGet, "/notes", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	res := rec.Result()
	loc := res.Header.Get("Location")
	// http.FileServer uses a relative Location ("notes/") for directory
	// canonicalization. Browsers resolve this to /notes/, which is correct.
	if res.StatusCode != http.StatusMovedPermanently {
		t.Errorf("GET /notes: want 301, got %d", res.StatusCode)
	}
	if loc != "notes/" && loc != "/notes/" {
		t.Errorf("GET /notes: want redirect to notes/ or /notes/, got %q", loc)
	}
}

func TestSPAHandler_RootServed(t *testing.T) {
	fs := fstest.MapFS{
		"index.html": {Data: []byte("<html>root</html>")},
	}
	h := newTestSPAHandler(fs)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Result().StatusCode != http.StatusOK {
		t.Errorf("GET /: want 200, got %d", rec.Result().StatusCode)
	}
}

func TestSPAHandler_StaticFileServed(t *testing.T) {
	fs := fstest.MapFS{
		"index.html":      {Data: []byte("<html>root</html>")},
		"styles/main.css": {Data: []byte("body{}")},
	}
	h := newTestSPAHandler(fs)

	req := httptest.NewRequest(http.MethodGet, "/styles/main.css", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Result().StatusCode != http.StatusOK {
		t.Errorf("GET /styles/main.css: want 200, got %d", rec.Result().StatusCode)
	}
}

func TestSPAHandler_UnknownRouteFallsBackToRoot(t *testing.T) {
	fs := fstest.MapFS{
		"index.html": {Data: []byte("<html>root</html>")},
	}
	h := newTestSPAHandler(fs)

	req := httptest.NewRequest(http.MethodGet, "/some-client-only-route", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Result().StatusCode != http.StatusOK {
		t.Errorf("GET /some-client-only-route: want 200 (SPA fallback), got %d", rec.Result().StatusCode)
	}
}

func TestSPAHandler_APIRoutePassedThrough(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/ping", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	fs := fstest.MapFS{"index.html": {Data: []byte("<html/>")}}
	h := NewSPAHandler(fs, mux)

	req := httptest.NewRequest(http.MethodGet, "/api/ping", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Result().StatusCode != http.StatusNoContent {
		t.Errorf("GET /api/ping: want 204, got %d", rec.Result().StatusCode)
	}
}
