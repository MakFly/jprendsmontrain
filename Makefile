.DEFAULT_GOAL := help

BUN ?= $(shell command -v bun 2>/dev/null || printf "%s/.bun/bin/bun" "$$HOME")
# 3333 = proxy API, 3020 = web, 3344/3345 = SNCF login mirrors (same proxy process).
DEV_PORTS := 3333 3020 3344 3345

.PHONY: help check-bun ensure-env ensure-deps install dev dev-proxy dev-web typecheck build kill clean

help:
	@echo "Available targets:"
	@echo "  make install    Install Bun workspaces and create .env if missing"
	@echo "  make dev        Run proxy + web through the root Turbo monorepo"
	@echo "  make dev-proxy  Run only the proxy"
	@echo "  make dev-web    Run only the web app"
	@echo "  make typecheck  Typecheck every workspace through Turbo"
	@echo "  make build      Build every buildable workspace through Turbo"
	@echo "  make kill       Stop local dev ports"
	@echo "  make clean      Remove generated dependencies and build output"

check-bun:
	@command -v $(BUN) >/dev/null 2>&1 || { \
		echo "Bun is required. Install it from https://bun.sh/docs/installation"; \
		exit 1; \
	}

ensure-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
	fi

ensure-deps: check-bun
	@if [ ! -d node_modules ]; then \
		echo "node_modules missing, installing dependencies..."; \
		$(MAKE) install; \
	fi

install: check-bun ensure-env
	$(BUN) install --frozen-lockfile

dev: ensure-env ensure-deps kill
	@echo "Starting proxy (3333) + web (3020) through Turbo..."
	$(BUN) run dev

dev-proxy: ensure-env ensure-deps
	$(BUN) run --filter @max-sncf/proxy dev

dev-web: ensure-deps
	$(BUN) run --filter @max-sncf/web dev

typecheck: ensure-deps
	$(BUN) run typecheck

build: ensure-deps
	$(BUN) run build

kill:
	@for port in $(DEV_PORTS); do \
		pids=$$(lsof -ti:$$port 2>/dev/null || true); \
		if [ -n "$$pids" ]; then \
			echo "$$pids" | xargs kill -9; \
		fi; \
	done

clean:
	rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/web/.next .turbo
