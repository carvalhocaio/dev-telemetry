run-api:
	cd api && uv run granian --interface asgi main:app --reload --access-log

run-web:
	cd web && rm -rf .next/ && pnpm dev

dev: run-api run-web
