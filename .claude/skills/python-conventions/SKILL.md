---
name: python-conventions
description: Python coding conventions for this project — style, typing, async, error handling and FastAPI layering. Auto-loaded when editing .py files.
user-invocable: false
paths:
  - "**/*.py"
---

Apply these conventions whenever you read or write Python files in this project.

## Tooling

- Package manager: `uv` — never use `pip install` directly
- Formatter: `ruff format`
- Linter: `ruff check --fix`
- Always run both before considering a file done
- Max line length: **88 characters**

## Imports

- Order: stdlib → third-party → local, each group separated by a blank line
- Never use wildcard imports (`from x import *`)
- Use `from __future__ import annotations` when needed for forward references

## Typing

- Type hints are **mandatory** on all public functions — parameters and return type
- Prefer `X | None` over `Optional[X]`
- Prefer `list[str]` over `List[str]`, `dict[str, int]` over `Dict[str, int]`
- Use `TypeAlias` and `NewType` to make domain concepts explicit
- Avoid `Any` — document with a comment if unavoidable

## Functions and classes

- Functions do one thing; max ~20 lines before considering extraction
- Docstrings on all public functions and classes
- No mutable default arguments (`def f(x=None)` not `def f(x=[])`)
- Constants in `UPPER_SNAKE_CASE` at module level
- Private helpers prefixed with `_`

## Async

- I/O-bound functions are `async def`
- Never call blocking I/O inside `async def` without `run_in_executor`
- Use `asyncio.sleep`, never `time.sleep` in async context
- Use `asyncio.gather` for concurrent independent coroutines

## Error handling

- Create domain-specific exceptions: `class UserNotFoundError(Exception): ...`
- Never silence with bare `except: pass` or `except Exception: pass`
- Use `contextlib.suppress` only for truly harmless errors, with a comment

## FastAPI layering

- **Routes**: HTTP only — no business logic inside route functions
- **Services**: business logic — never import from `fastapi`
- **Repositories**: data access only — services never query the DB directly
- Map domain exceptions to HTTP in exception handlers, not in route functions
- `HTTPException` never leaves the router layer
- Use Pydantic models for all request bodies and responses
