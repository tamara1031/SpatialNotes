# Stage 1: Rust/WASM Builder (canvas-wasm + markdown-wasm)
FROM rust:1.85-slim AS wasm-builder

RUN apt-get update && apt-get install -y binaryen curl && \
     curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app

# wasm-builder
COPY packages/canvas-wasm/Cargo.toml \
     packages/canvas-wasm/Cargo.lock \
     ./packages/canvas-wasm/
COPY packages/canvas-wasm/src/ \
     ./packages/canvas-wasm/src/
RUN cd packages/canvas-wasm && \
     wasm-pack build --target web --out-dir dist

# wasm-builder
COPY packages/markdown-wasm/Cargo.toml \
     packages/markdown-wasm/Cargo.lock \
     ./packages/markdown-wasm/
COPY packages/markdown-wasm/src/ \
     ./packages/markdown-wasm/src/
RUN cd packages/markdown-wasm && \
     wasm-pack build --target web --out-dir dist

# Stage 2: Web Builder (Node.js)
FROM node:24-slim AS web-builder

RUN npm install -g pnpm@10.17.0

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files first for efficient dependency caching
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/canvas-engine/package.json ./packages/canvas-engine/
COPY packages/canvas-wasm/package.json \
     ./packages/canvas-wasm/
COPY packages/markdown-engine/package.json ./packages/markdown-engine/
COPY packages/markdown-wasm/package.json \
     ./packages/markdown-wasm/
COPY packages/engine-core/package.json ./packages/engine-core/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Copy built WASM artifacts from Stage 1
COPY --from=wasm-builder \
     /app/packages/canvas-wasm/dist/ \
     ./packages/canvas-wasm/dist/
COPY --from=wasm-builder \
     /app/packages/markdown-wasm/dist/ \
     ./packages/markdown-wasm/dist/

# Build core packages first
RUN pnpm build:core

# Build web app
RUN pnpm build:web

# Stage 3: Server Builder (Go)
FROM golang:1.25-alpine AS server-builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY apps/server/ ./apps/server/
COPY --from=web-builder /app/apps/web/dist/ ./apps/server/cmd/server/dist/

RUN go build -o /app/server ./apps/server/cmd/server/main.go

# Stage 4: Final Runtime (Alpine)
FROM alpine:latest

RUN apk add --no-cache ca-certificates libc6-compat

WORKDIR /app
COPY --from=server-builder /app/server ./server

EXPOSE 8080

CMD ["./server"]
