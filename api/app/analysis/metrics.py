from dataclasses import dataclass
from datetime import date, timedelta
from enum import Enum

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Commit, PullRequest


def bucket_start(granularity: "Granularity", day: date) -> date:
    """Return the period start for ``day``, matching Postgres ``date_trunc``.

    Postgres ``date_trunc('week', ...)`` snaps to Monday (ISO weekday 1).
    """
    if granularity is Granularity.DAILY:
        return day
    if granularity is Granularity.WEEKLY:
        return day - timedelta(days=day.weekday())
    return day.replace(day=1)


class Granularity(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


_TRUNC: dict[Granularity, str] = {
    Granularity.DAILY: "day",
    Granularity.WEEKLY: "week",
    Granularity.MONTHLY: "month",
}

_EMPTY_COMMITS = (0, 0, 0, 0)
_EMPTY_PULLS = (0, 0)


@dataclass(frozen=True, slots=True)
class PeriodMetrics:
    period: date
    commit_count: int
    additions: int
    deletions: int
    active_days: int
    pr_count: int
    pr_merged: int

    @property
    def throughput(self) -> int:
        return self.commit_count + self.pr_count

    @property
    def churn(self) -> int:
        return self.additions + self.deletions

    @property
    def merge_rate(self) -> float | None:
        if self.pr_count == 0:
            return None
        return self.pr_merged / self.pr_count


class MetricsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def compute(self, granularity: Granularity) -> list[PeriodMetrics]:
        trunc = _TRUNC[granularity]
        commits = await self._commit_aggregates(trunc)
        pulls = await self._pr_aggregates(trunc)
        return self._merge(commits, pulls)

    async def _commit_aggregates(
        self, trunc: str
    ) -> dict[date, tuple[int, int, int, int]]:
        bucket = func.date_trunc(trunc, Commit.authored_at).label("bucket")
        stmt = select(
            bucket,
            func.count(),
            func.coalesce(func.sum(Commit.additions), 0),
            func.coalesce(func.sum(Commit.deletions), 0),
            func.count(func.distinct(cast(Commit.authored_at, Date))),
        ).group_by(bucket)
        rows = (await self._session.execute(stmt)).all()
        return {r[0].date(): (r[1], r[2], r[3], r[4]) for r in rows}

    async def _pr_aggregates(self, trunc: str) -> dict[date, tuple[int, int]]:
        bucket = func.date_trunc(trunc, PullRequest.gh_created_at).label("bucket")
        stmt = select(
            bucket,
            func.count(),
            func.count().filter(PullRequest.state == "merged"),
        ).group_by(bucket)
        rows = (await self._session.execute(stmt)).all()
        return {r[0].date(): (r[1], r[2]) for r in rows}

    @staticmethod
    def _merge(
        commits: dict[date, tuple[int, int, int, int]],
        pulls: dict[date, tuple[int, int]],
    ) -> list[PeriodMetrics]:
        periods = sorted(set(commits) | set(pulls))
        result: list[PeriodMetrics] = []
        for period in periods:
            commit_count, additions, deletions, active_days = commits.get(
                period, _EMPTY_COMMITS
            )
            pr_count, pr_merged = pulls.get(period, _EMPTY_PULLS)
            result.append(
                PeriodMetrics(
                    period=period,
                    commit_count=commit_count,
                    additions=additions,
                    deletions=deletions,
                    active_days=active_days,
                    pr_count=pr_count,
                    pr_merged=pr_merged,
                )
            )
        return result
