package application

import (
	"io/fs"
	"net/http"
	"strings"
)

// SPAHandler handles static file serving with fallback to index.html for SPA routing.
type SPAHandler struct {
	FileSystem    fs.FS
	StaticHandler http.Handler
	IndexFile     string
	APIPrefix     string
	APIMux        *http.ServeMux
}

// NewSPAHandler creates a new SPAHandler.
func NewSPAHandler(distFS fs.FS, apiMux *http.ServeMux) *SPAHandler {
	return &SPAHandler{
		FileSystem:    distFS,
		StaticHandler: http.FileServer(http.FS(distFS)),
		IndexFile:     "index.html",
		APIPrefix:     "/api",
		APIMux:        apiMux,
	}
}

func (h *SPAHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Serve API if requested
	if strings.HasPrefix(r.URL.Path, h.APIPrefix) {
		h.APIMux.ServeHTTP(w, r)
		return
	}

	// Prepare the path for the static filesystem
	path := r.URL.Path
	fullPath := strings.TrimPrefix(path, "/")
	if fullPath == "" {
		fullPath = h.IndexFile
	}

	// Check if the file exists in the embedded filesystem
	if _, err := fs.Stat(h.FileSystem, fullPath); err != nil {
		// File not found, try appending index.html for directories
		altPath := fullPath
		if strings.HasSuffix(altPath, "/") {
			altPath += h.IndexFile
		} else if !strings.Contains(altPath, ".") {
			altPath += "/" + h.IndexFile
		}

		// Check if the alternative index path exists
		if _, errAlt := fs.Stat(h.FileSystem, altPath); errAlt == nil {
			r.URL.Path = "/" + altPath
		} else {
			// Fallback to root index.html for client-side routing
			r.URL.Path = "/"
		}
	}

	// Serve the file using the standard static handler
	h.StaticHandler.ServeHTTP(w, r)
}
