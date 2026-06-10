run-web:
	cd apps/web && bun dev

dev:
	mprocs

install:
	bun install

test:
	bun run test

typecheck:
	bun run typecheck

lint:
	bun run lint

.PHONY: run-web dev install test typecheck lint
