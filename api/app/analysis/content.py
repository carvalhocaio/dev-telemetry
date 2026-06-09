from dataclasses import dataclass
from datetime import date

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.metrics import _TRUNC, Granularity
from app.models import Commit, PullRequest


@dataclass(frozen=True, slots=True)
class PeriodContent:
    commit_messages: list[str]
    pr_texts: list[str]
    patches: list[str]


class ContentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def fetch(self, granularity: Granularity, period: date) -> PeriodContent:
        trunc = _TRUNC[granularity]
        commit_messages, patches = await self._commits(trunc, period)
        pr_texts = await self._pull_requests(trunc, period)
        return PeriodContent(
            commit_messages=commit_messages,
            pr_texts=pr_texts,
            patches=patches,
        )

    async def _commits(self, trunc: str, period: date) -> tuple[list[str], list[str]]:
        bucket = cast(func.date_trunc(trunc, Commit.authored_at), Date)
        stmt = (
            select(Commit.message, Commit.patch)
            .where(bucket == period)
            .order_by(Commit.authored_at)
        )
        rows = (await self._session.execute(stmt)).all()
        messages = [r[0] for r in rows if r[0]]
        patches = [r[1] for r in rows if r[1]]
        return messages, patches

    async def _pull_requests(self, trunc: str, period: date) -> list[str]:
        bucket = cast(func.date_trunc(trunc, PullRequest.gh_created_at), Date)
        stmt = (
            select(PullRequest.title, PullRequest.body)
            .where(bucket == period)
            .order_by(PullRequest.gh_created_at)
        )
        rows = (await self._session.execute(stmt)).all()
        return [_pr_text(title, body) for title, body in rows]


def _pr_text(title: str, body: str | None) -> str:
    if body:
        return f"{title}\n\n{body}"
    return title
