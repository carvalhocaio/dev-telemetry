run-api:
	cd api && uv run granian --interface asgi main:app --reload --access-log

run-web:
	cd web && rm -rf .next/ && pnpm dev

dev:
	mprocs

# Fallback sem instalar nada: roda os dois em paralelo (saídas intercaladas)
dev-parallel:
	$(MAKE) -j2 run-api run-web

.PHONY: run-api run-web dev dev-parallel
