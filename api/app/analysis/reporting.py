from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.classifier import (
    _LEVEL_CUTS,
    WEIGHTS,
    Classifier,
    PeriodClassification,
)
from app.analysis.metrics import (
    Granularity,
    MetricsService,
    PeriodMetrics,
    bucket_start,
)
from app.schemas.reports import (
    Coverage,
    PeriodReport,
    Report,
    ReportMeta,
    WindowSummary,
)

SMALL_SAMPLE_THRESHOLD = 8


class ReportService:
    def __init__(self, session: AsyncSession) -> None:
        self._metrics = MetricsService(session)
        self._classifier = Classifier()

    async def build(
        self,
        granularity: Granularity,
        start: date | None = None,
        end: date | None = None,
    ) -> Report:
        metrics = await self._metrics.compute(granularity)
        classifications = self._classifier.classify(metrics)
        by_period: dict[date, PeriodMetrics] = {m.period: m for m in metrics}

        in_window = [
            (by_period[c.period], c)
            for c in classifications
            if _within(c.period, start, end)
        ]

        periods = [_to_report(m, c) for m, c in in_window]
        periods.reverse()

        window = _build_window(granularity, in_window, start, end)

        return Report(
            meta=ReportMeta(
                granularity=granularity.value,
                sample_size=len(metrics),
                weights=WEIGHTS,
                level_cuts={level.value: cut for cut, level in _LEVEL_CUTS},
                small_sample=len(metrics) < SMALL_SAMPLE_THRESHOLD,
                coverage=_coverage(metrics),
            ),
            window=window,
            periods=periods,
        )


def _within(period: date, start: date | None, end: date | None) -> bool:
    if start is not None and period < start:
        return False
    if end is not None and period > end:
        return False
    return True


def _coverage(metrics: list[PeriodMetrics]) -> Coverage:
    if not metrics:
        return Coverage(first=None, last=None)
    return Coverage(first=metrics[0].period, last=metrics[-1].period)


def _build_window(
    granularity: Granularity,
    in_window: list[tuple[PeriodMetrics, PeriodClassification]],
    start: date | None,
    end: date | None,
) -> WindowSummary:
    metrics = [m for m, _ in in_window]
    composite = (
        sum(c.composite for _, c in in_window) / len(in_window) if in_window else 0.0
    )
    periods = [m.period for m in metrics]
    current_bucket = bucket_start(granularity, date.today())

    return WindowSummary(
        start=start if start is not None else (min(periods) if periods else None),
        end=end if end is not None else (max(periods) if periods else None),
        level=Classifier._to_level(composite),
        composite=round(composite, 4),
        commit_count=sum(m.commit_count for m in metrics),
        pr_count=sum(m.pr_count for m in metrics),
        pr_merged=sum(m.pr_merged for m in metrics),
        additions=sum(m.additions for m in metrics),
        deletions=sum(m.deletions for m in metrics),
        active_days=sum(m.active_days for m in metrics),
        partial_current=current_bucket in periods,
    )


def _to_report(m: PeriodMetrics, c: PeriodClassification) -> PeriodReport:
    return PeriodReport(
        period=m.period,
        level=c.level,
        composite=round(c.composite, 4),
        components={k: round(v, 4) for k, v in c.components.items()},
        commit_count=m.commit_count,
        pr_count=m.pr_count,
        pr_merged=m.pr_merged,
        additions=m.additions,
        deletions=m.deletions,
        active_days=m.active_days,
        merge_rate=round(m.merge_rate, 4) if m.merge_rate is not None else None,
    )
