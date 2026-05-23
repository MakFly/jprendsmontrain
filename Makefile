.DEFAULT_GOAL := help

BUN ?= $(shell command -v bun 2>/dev/null || printf "%s/.bun/bin/bun" "$$HOME")
DEV_PORTS := 3333 3020

.PHONY: help check-bun ensure-env install dev dev-proxy dev-web typecheck build kill clean

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

install: check-bun ensure-env
	$(BUN) install --frozen-lockfile

dev: check-bun ensure-env kill
	@echo "Starting proxy (3333) + web (3020) through Turbo..."
	$(BUN) run dev

dev-proxy: check-bun ensure-env
	$(BUN) run --filter @max-sncf/proxy dev

dev-web: check-bun
	$(BUN) run --filter @max-sncf/web dev

typecheck: check-bun
	$(BUN) run typecheck

build: check-bun
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
