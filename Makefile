run-api:
	cd api && uv run granian --interface asgi main:app --reload --access-log
