.PHONY: dev dev-proxy dev-web install typecheck kill clean

BUN := $(HOME)/.bun/bin/bun

install:
	$(BUN) install

dev: kill
	@echo "Starting proxy (3333) + web (3020)..."
	@cd apps/proxy && $(BUN) --watch src/index.ts &
	@sleep 1
	@cd apps/web && $(BUN) x next dev --port 3020 &
	@echo ""
	@echo "  Proxy: http://localhost:3333"
	@echo "  Web:   http://localhost:3020"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@wait

dev-proxy:
	cd apps/proxy && $(BUN) --watch src/index.ts

dev-web:
	cd apps/web && $(BUN) x next dev --port 3020

typecheck:
	cd apps/proxy && $(BUN) x tsc --noEmit
	cd apps/web && $(BUN) x tsc --noEmit

kill:
	@lsof -ti:3333 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3020 | xargs kill -9 2>/dev/null || true

clean:
	rm -rf node_modules apps/proxy/node_modules apps/web/node_modules apps/web/.next
