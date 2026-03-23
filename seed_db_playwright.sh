#!/bin/bash
mkdir -p bin
# Force kill any existing test-server
pkill test-server || true
go build -o bin/test-server apps/server/cmd/server/main.go
# Use a unique DB file for this run to avoid schema cache issues
export DSN="test_spatial_notes_$(date +%s).db"
rm -f "$DSN"*
# Start the server with reset-db flag
./bin/test-server -reset-db
