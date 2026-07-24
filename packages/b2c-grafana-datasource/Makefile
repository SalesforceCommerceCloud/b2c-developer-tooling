.PHONY: demo real real-env down logs clean build-plugin build-frontend build-backend help

# Default target
.DEFAULT_GOAL := help

# B2C CLI wrapper (resolves credentials from dw.json + OS keychain). Override if
# your checkout lives elsewhere: `make real CLI=/path/to/cli`.
CLI ?= ../../cli
# Instance name (from the b2c CLI config) to pull real credentials for.
INSTANCE ?= bdpx-prd

# ============================================================================
# Docker Compose Commands
# ============================================================================

demo: ## Start Grafana + mock-metrics with synthetic data (no credentials needed)
	docker compose up --build

real: ## Start Grafana against the LIVE Metrics API for $(INSTANCE) (creds via b2c CLI keychain)
	@echo "Resolving credentials for instance '$(INSTANCE)' via the b2c CLI (keychain/password-store)..."
	@creds=$$($(CLI) setup inspect -i $(INSTANCE) --json --unmask 2>/dev/null) || { echo "ERROR: could not run '$(CLI) setup inspect -i $(INSTANCE) --json --unmask'"; exit 1; }; \
	export B2C_CLIENT_ID=$$(printf '%s' "$$creds" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).config.clientId||"")}catch{console.log("")}})'); \
	export B2C_CLIENT_SECRET=$$(printf '%s' "$$creds" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).config.clientSecret||"")}catch{console.log("")}})'); \
	export B2C_SHORT_CODE=$$(printf '%s' "$$creds" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).config.shortCode||"")}catch{console.log("")}})'); \
	export B2C_TENANT_ID=$$(printf '%s' "$$creds" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).config.tenantId||"")}catch{console.log("")}})'); \
	export B2C_ACCOUNT_MANAGER_HOST=$${B2C_ACCOUNT_MANAGER_HOST:-account.demandware.com}; \
	if [ -z "$$B2C_CLIENT_ID" ] || [ -z "$$B2C_CLIENT_SECRET" ] || [ -z "$$B2C_SHORT_CODE" ] || [ -z "$$B2C_TENANT_ID" ]; then \
	  echo "ERROR: missing resolved credentials for '$(INSTANCE)' (clientId/clientSecret/shortCode/tenantId). Check '$(CLI) setup inspect -i $(INSTANCE)'."; exit 1; fi; \
	echo "Using shortCode=$$B2C_SHORT_CODE tenantId=$$B2C_TENANT_ID clientId=$${B2C_CLIENT_ID%%-*}… (secret hidden)"; \
	docker compose -f docker-compose.yml -f docker-compose.real.yml up -d --build grafana

down: ## Stop and remove all containers (both modes)
	docker compose -f docker-compose.yml -f docker-compose.real.yml down 2>/dev/null || docker compose down

logs: ## Follow logs from all containers
	docker compose logs -f

clean: ## Stop containers and remove volumes
	docker compose -f docker-compose.yml -f docker-compose.real.yml down -v 2>/dev/null || docker compose down -v

# ============================================================================
# Local Build Commands (without Docker)
# ============================================================================

build-plugin: build-frontend build-backend ## Build both frontend and backend locally

build-frontend: ## Build frontend (module.js + plugin.json + logo)
	@echo "Building frontend..."
	npm install
	npm run build
	@echo "Frontend artifacts in dist/"

build-backend: ## Build Go backend binaries for linux (amd64 + arm64)
	@echo "Building metrics backend for linux/amd64..."
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o dist/gpx_b2c_metrics_linux_amd64 ./pkg
	@echo "Building metrics backend for linux/arm64..."
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o dist/gpx_b2c_metrics_linux_arm64 ./pkg
	@echo "Building CIP backend for linux/amd64..."
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o dist/gpx_b2c_cip_linux_amd64 ./pkg/cip
	@echo "Building CIP backend for linux/arm64..."
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o dist/gpx_b2c_cip_linux_arm64 ./pkg/cip
	@echo "Backend binaries in dist/"

# ============================================================================
# Development Commands
# ============================================================================

dev-frontend: ## Build frontend in watch mode
	npm run dev

test-backend: ## Run Go backend tests
	go test -v ./...

lint-frontend: ## Lint frontend code
	npm run lint

typecheck: ## Run TypeScript type checking
	npm run typecheck

# ============================================================================
# Help
# ============================================================================

help: ## Show this help message
	@echo "B2C Commerce Metrics Grafana Plugin - Makefile"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick start:"
	@echo "  make demo    # Start demo environment"
	@echo "  make logs    # View logs"
	@echo "  make down    # Stop demo"
