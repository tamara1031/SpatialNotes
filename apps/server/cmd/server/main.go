package main

import (
	"context"
	"embed"
	"errors"
	"flag"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/tamara1031/spatial-notes/apps/server/internal/application"
	"github.com/tamara1031/spatial-notes/apps/server/internal/infrastructure"
	"github.com/tamara1031/spatial-notes/apps/server/internal/repository"
	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/tamara1031/spatial-notes/apps/server/pkg/logger"
)

// Static assets from Astro build
//
//go:embed all:dist
var staticAssets embed.FS

func main() {
	resetDB := flag.Bool("reset-db", false, "Reset the database on startup")
	flag.Parse()

	// Initialize Logger
	logger.Init(logger.Config{
		Level:  slog.LevelDebug,
		Format: "json",
		Output: os.Stdout,
	})

	// Initialize DB
	ctx := context.Background()
	dsn := os.Getenv("DSN")
	if dsn == "" {
		dsn = "spatial_notes.db"
	}
	logger.Info("Initializing database", "dsn", dsn)
	db, err := infrastructure.NewDB("sqlite", dsn)
	if err != nil {
		logger.Error("Failed to initialize DB", "error", err)
		os.Exit(1)
	}
	defer func() {
		logger.Info("Closing database connection")
		db.Close()
	}()

	if *resetDB {
		logger.Info("Resetting database as requested")
		infrastructure.DropSchema(ctx, db)
	}

	if err := infrastructure.CreateSchema(ctx, db); err != nil {
		logger.Error("Failed to run migrations", "error", err)
		os.Exit(1)
	}

	nodeRepo := repository.NewNodeRepository(db)
	nodeUpdateRepo := repository.NewNodeUpdateRepository(db)
	userRepo := repository.NewUserRepository(db)
	authRepo := repository.NewAuthenticatorRepository(db)

	nodeSvc := service.NewNodeService(nodeRepo, nodeRepo, nodeUpdateRepo)
	nodeHandler := application.NewNodeHandler(nodeSvc)

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "spatial-notes-default-secret-change-me"
	}
	authSvc := service.NewAuthService(userRepo, authRepo, jwtSecret)
	authHandler := application.NewAuthHandler(authSvc)
	authMiddleware := application.AuthMiddleware(authSvc)

	mux := http.NewServeMux()

	// Auth API (Public)
	mux.HandleFunc("GET /api/auth/salt", authHandler.HandleGetSalt)
	mux.HandleFunc("POST /api/auth/register", authHandler.HandleRegister)
	mux.HandleFunc("POST /api/auth/login", authHandler.HandleLogin)

	// Protected API
	mux.Handle("GET /api/nodes", authMiddleware(http.HandlerFunc(nodeHandler.HandleList)))
	mux.Handle("POST /api/nodes", authMiddleware(http.HandlerFunc(nodeHandler.HandleUpsert)))
	mux.Handle("DELETE /api/nodes/", authMiddleware(http.HandlerFunc(nodeHandler.HandleDelete)))
	mux.Handle("POST /api/nodes/{id}/updates", authMiddleware(http.HandlerFunc(nodeHandler.HandlePushUpdate)))
	mux.Handle("GET /api/nodes/{id}/updates", authMiddleware(http.HandlerFunc(nodeHandler.HandleGetUpdates)))
	mux.Handle("GET /api/search", authMiddleware(http.HandlerFunc(nodeHandler.HandleSearch)))

	// Initialize SPA and Static File Handler
	distFS, err := fs.Sub(staticAssets, "dist")
	if err != nil {
		logger.Error("Failed to sub-fs dist", "error", err)
		os.Exit(1)
	}
	spaHandler := application.NewSPAHandler(distFS, mux)

	// Middleware-wrapped handler
	handler := application.GzipMiddleware(spaHandler)

	server := &http.Server{
		Addr:              ":8080",
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// Channel to listen for interrupt signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("Starting server", "port", 8080)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-stop
	logger.Info("Received termination signal. Shutting down gracefully...")

	ctxShutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctxShutdown); err != nil {
		logger.Error("Server shutdown failed", "error", err)
	} else {
		logger.Info("Server stopped gracefully")
	}
}
