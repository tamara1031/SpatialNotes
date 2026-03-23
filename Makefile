# --- Variables ---
BIN_DIR       := bin
WEB_DIR       := apps/web
SERVER_DIR    := apps/server
PACKAGES_DIR  := packages
WEB_DIST      := $(WEB_DIR)/dist
SERVER_BIN    := $(BIN_DIR)/server
MAIN_GO       := $(SERVER_DIR)/cmd/server/main.go
SERVER_DIST   := $(SERVER_DIR)/cmd/server/dist

# --- Color Definitions ---
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
RESET  := \033[0m

# --- Default Target ---
.PHONY: help
help: ## Show this help
	@echo "$(CYAN)SpatialNotes Monorepo Management$(RESET)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-15s$(RESET) %s\n", $$1, $$2}'

# --- Docker ---
.PHONY: docker-build docker-run docker-dev docker-stop docker-clean

docker-build: ## [DOCKER] Build production Docker image
	@echo "$(GREEN)Building production Docker image...$(RESET)"
	@docker build -t spatial-notes .

docker-run: ## [DOCKER] Build and run production Docker image
	@echo "$(GREEN)Running production Docker container...$(RESET)"
	@docker build -t spatial-notes .
	@echo "$(YELLOW)Ensuring port 8080 is clean...$(RESET)"
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@docker run -p 8080:8080 spatial-notes

docker-dev: ## [DOCKER] Start development environment using docker-compose
	@echo "$(GREEN)Starting Docker development environment...$(RESET)"
	@docker-compose up --build

docker-stop: ## [DOCKER] Stop Docker development environment
	@echo "$(YELLOW)Stopping Docker environment...$(RESET)"
	@docker-compose down

docker-clean: ## [DOCKER] Cleanup Docker images and volumes
	@echo "$(YELLOW)Cleaning up Docker resources...$(RESET)"
	@docker-compose down -v --rmi all
	@docker image rm spatial-notes || true

# --- Environment Check ---
.PHONY: check-env
check-env: ## Check if all required tools are installed
	@echo "$(GREEN)Checking environment...$(RESET)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Node.js is not installed.$(RESET)"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "$(RED)pnpm is not installed. Run: npm install -g pnpm$(RESET)"; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo "$(RED)Go is not installed.$(RESET)"; exit 1; }
	@command -v cargo >/dev/null 2>&1 || { echo "$(RED)Rust/Cargo is not installed.$(RESET)"; exit 1; }
	@if ! command -v wasm-pack >/dev/null 2>&1; then \
		echo "$(YELLOW)wasm-pack not found. Attempting to install...$(RESET)"; \
		cargo install wasm-pack || { echo "$(RED)Failed to install wasm-pack.$(RESET)"; exit 1; }; \
	fi
	@echo "$(GREEN)Environment is ready.$(RESET)"

# --- Setup & Install ---
.PHONY: install setup clean
install: ## Install all pnpm dependencies
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@pnpm install

setup: check-env install ## Initial setup: Check env, Install and build all packages
	@echo "$(GREEN)Building core packages...$(RESET)"
	@$(MAKE) build-wasm
	@pnpm --filter core --filter canvas-engine exec echo "Building web libraries..."
	@echo "$(GREEN)Project setup complete. Run 'make dev' to start development.$(RESET)"

clean: ## Cleanup build artifacts and node_modules
	@echo "$(YELLOW)Cleaning up...$(RESET)"
	@rm -rf $(BIN_DIR)
	@rm -rf $(SERVER_DIST)
	@pnpm -r exec rm -rf dist .turbo node_modules
	@rm -rf node_modules
	@rm -rf $(PACKAGES_DIR)/canvas-engine/packages/canvas-wasm/pkg
	@rm -rf $(PACKAGES_DIR)/canvas-engine/packages/canvas-wasm/dist
	@rm -f *.log search_res.txt spatial_notes.db
	@rm -rf playwright-report/ test-results/

# --- Development ---
.PHONY: dev stop build-wasm

stop: ## [DEV] Stop all running development servers (Node, Go)
	@echo "$(YELLOW)Stopping development servers...$(RESET)"
	@pkill -f "run-p" || true
	@pkill -f "pnpm.*dev" || true
	@pkill -f "dev-server" || true
	@echo "$(GREEN)Stopped.$(RESET)"

dev: build-wasm ## [DEV] Run Frontend (Astro) and Backend (Go) concurrently
	@echo "$(GREEN)Starting development servers...$(RESET)"
	@pnpm dev

build-wasm: ## [DEV] Build Rust/Wasm module
	@echo "$(GREEN)Compiling Rust/Wasm cores...$(RESET)"
	@cd $(PACKAGES_DIR)/canvas-engine/packages/canvas-wasm && wasm-pack build --target web --out-dir dist
	@cd $(PACKAGES_DIR)/markdown-engine/packages/markdown-wasm && wasm-pack build --target web --out-dir dist
	@# Ensure types are correctly exported for TS
	@[ -f $(PACKAGES_DIR)/canvas-engine/packages/canvas-wasm/dist/canvas_wasm.d.ts ] || echo "$(YELLOW)Warning: canvas d.ts not found$(RESET)"
	@[ -f $(PACKAGES_DIR)/markdown-engine/packages/markdown-wasm/dist/markdown_wasm.d.ts ] || echo "$(YELLOW)Warning: markdown d.ts not found$(RESET)"

# --- Production Build ---
.PHONY: build build-server build-web sync-assets
build: ## [PROD] Full production build (Wasm -> TS -> Astro -> Go)
	@echo "$(GREEN)Starting full production build...$(RESET)"
	@$(MAKE) build-wasm
	@pnpm build:core
	@pnpm --filter web build
	@$(MAKE) sync-assets
	@mkdir -p $(BIN_DIR)
	@echo "$(GREEN)Building Go server binary...$(RESET)"
	@go build -o $(SERVER_BIN) $(MAIN_GO)
	@echo "$(GREEN)Production build complete! Binary is at: $(SERVER_BIN)$(RESET)"

run: ## [PROD] Run the production-built Go server
	@if [ -f "$(SERVER_BIN)" ]; then \
		echo "$(YELLOW)Ensuring port 8080 is clean...$(RESET)"; \
		lsof -ti:8080 | xargs kill -9 2>/dev/null || true; \
		echo "$(GREEN)Running production server...$(RESET)"; \
		./$(SERVER_BIN); \
	else \
		echo "$(YELLOW)Binary not found. Run 'make build' first.$(RESET)"; \
		exit 1; \
	fi

sync-assets: ## Sync Astro build artifacts to Go assets
	@mkdir -p $(SERVER_DIST)
	@if [ -d "$(WEB_DIST)" ]; then \
		cp -r $(WEB_DIST)/* $(SERVER_DIST)/; \
		echo "$(GREEN)Assets synced to $(SERVER_DIST)$(RESET)"; \
	else \
		echo "$(YELLOW)Warning: $(WEB_DIST) not found. Run 'make build' first.$(RESET)"; \
	fi

# --- Quality & Verification ---
.PHONY: test lint test-e2e
test: ## Run all unit tests across the monorepo
	@pnpm test

test-e2e: ## Run E2E tests (Playwright)
	@pnpm test:e2e

lint: ## Run all linters (Biome, Go)
	@pnpm lint
