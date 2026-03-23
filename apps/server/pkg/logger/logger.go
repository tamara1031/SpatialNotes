package logger

import (
	"context"
	"io"
	"log/slog"
	"os"
	"sync"
)

type contextKey string

const (
	RequestIDKey contextKey = "request_id"
	TraceIDKey   contextKey = "trace_id"
)

var (
	defaultLogger *slog.Logger
	once          sync.Once
)

// Config holds logger configuration
type Config struct {
	Level  slog.Level
	Format string // "json" or "text"
	Output io.Writer
}

// Init initializes the global logger
func Init(cfg Config) {
	once.Do(func() {
		if cfg.Output == nil {
			cfg.Output = os.Stdout
		}

		var handler slog.Handler
		opts := &slog.HandlerOptions{
			Level: cfg.Level,
		}

		if cfg.Format == "json" {
			handler = slog.NewJSONHandler(cfg.Output, opts)
		} else {
			handler = slog.NewTextHandler(cfg.Output, opts)
		}

		defaultLogger = slog.New(handler)
		slog.SetDefault(defaultLogger)
	})
}

// Get returns the global logger
func Get() *slog.Logger {
	if defaultLogger == nil {
		Init(Config{Level: slog.LevelInfo, Format: "text"})
	}
	return defaultLogger
}

// WithContext returns a logger with values from context
func WithContext(ctx context.Context) *slog.Logger {
	l := Get()
	if rid, ok := ctx.Value(RequestIDKey).(string); ok {
		l = l.With(slog.String("request_id", rid))
	}
	if tid, ok := ctx.Value(TraceIDKey).(string); ok {
		l = l.With(slog.String("trace_id", tid))
	}
	return l
}

// Shorthand methods for global logger
func Info(msg string, args ...any)  { Get().Info(msg, args...) }
func Error(msg string, args ...any) { Get().Error(msg, args...) }
func Debug(msg string, args ...any) { Get().Debug(msg, args...) }
func Warn(msg string, args ...any)  { Get().Warn(msg, args...) }

func InfoContext(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Info(msg, args...)
}

func ErrorContext(ctx context.Context, msg string, args ...any) {
	WithContext(ctx).Error(msg, args...)
}
