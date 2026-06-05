from contextlib import asynccontextmanager

from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference

from app.config import get_settings
from app.db import init_models

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_models()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/scalar", include_in_schema=False)
async def scalar_docs():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=settings.app_name,
    )
