from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_auth
from app.config import get_settings
from app.db import get_session
from app.github.client import create_github_client
from app.github.collector import (
    DEFAULT_WINDOW_DAYS,
    INCREMENTAL_WINDOW_DAYS,
    GitHubCollector,
)
from app.models import Commit, PullRequest, Repository

router = APIRouter(tags=["sync"], dependencies=[Depends(require_auth)])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.post("/refresh")
async def refresh(session: SessionDep) -> dict[str, int]:
    return await _run_sync(session, window_days=INCREMENTAL_WINDOW_DAYS)


@router.post("/refresh/full")
async def refresh_full(session: SessionDep) -> dict[str, int]:
    return await _run_sync(session, window_days=DEFAULT_WINDOW_DAYS)


async def _run_sync(session: AsyncSession, *, window_days: int) -> dict[str, int]:
    settings = get_settings()
    client = create_github_client()
    try:
        collector = GitHubCollector(
            client,
            session,
            org=settings.github_org,
            username=settings.github_username,
            window_days=window_days,
        )
        await collector.collect()
    finally:
        await client.aclose()

    return await _summary(session)


async def _summary(session: AsyncSession) -> dict[str, int]:
    return {
        "repositories": await session.scalar(
            select(func.count()).select_from(Repository)
        )
        or 0,
        "commits": await session.scalar(select(func.count()).select_from(Commit)) or 0,
        "pull_requests": await session.scalar(
            select(func.count()).select_from(PullRequest)
        )
        or 0,
    }
