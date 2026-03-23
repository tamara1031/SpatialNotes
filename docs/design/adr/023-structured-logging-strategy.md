# ADR-023: Structured Logging Strategy

## Status
Proposed

## Context
As the backend scales and handles multiple rooms and real-time synchronization, debugging becomes difficult with standard, unstructured logs. We need a way to trace requests, monitor performance, and filter logs by severity or context (e.g., Room ID, Request ID).

## Decision
We implement a unified, structured logging system using Go's standard **`log/slog`** package (available in Go 1.21+):

1.  **Unified Package**: A dedicated `pkg/logger` provides a wrapper around `slog` for consistent configuration across the application.
2.  **Contextual Awareness**: Logs can include contextual information such as `request_id`, `room_id`, and `error` details.
3.  **HTTP Middleware**: An automatic logging middleware captures all incoming HTTP requests, recording the method, path, status code, and duration.
4.  **Format Flexibility**: Supports both "Text" format (human-readable during development) and "JSON" format (machine-readable for production log aggregators).

### Log Levels
- **DEBUG**: Verbose information for development (e.g., WS client registration).
- **INFO**: General operational events (e.g., server start, request completed).
- **WARN**: Significant events that are not errors (e.g., buffer full).
- **ERROR**: Critical failures requiring attention (e.g., DB connection loss, WS read errors).

## Consequences

### Positive
- **Improved Debuggability**: Searchable and filterable logs make it easier to pinpoint issues in specific rooms or sessions.
- **Performance Monitoring**: Middleware logs provide immediate visibility into request latency.
- **Zero Heavy Dependencies**: By using `slog`, we avoid adding large third-party logging libraries like Zap or Zerolog while maintaining high performance.

### Negative
- **Context Management**: Developers must ensure that important IDs (like `room_id`) are passed through the logger's arguments or context.
