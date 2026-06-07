from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.classifier import _LEVEL_CUTS, WEIGHTS, Classifier
from app.analysis.metrics import Granularity, MetricsService, PeriodMetrics
from app.schemas.reports import PeriodReport, Report, ReportMeta

SMALL_SAMPLE_THRESHOLD = 8


class ReportService:
    def __init__(self, session: AsyncSession) -> None:
        self._metrics = MetricsService(session)
        self._classifier = Classifier()

    async def build(self, granularity: Granularity) -> Report:
        metrics = await self._metrics.compute(granularity)
        classifications = self._classifier.classify(metrics)

        by_period: dict = {m.period: m for m in metrics}
        periods = [_to_report(by_period[c.period], c) for c in classifications]
        periods.reverse()

        return Report(
            meta=ReportMeta(
                granularity=granularity.value,
                sample_size=len(metrics),
                weights=WEIGHTS,
                level_cuts={level.value: cut for cut, level in _LEVEL_CUTS},
                small_sample=len(metrics) < SMALL_SAMPLE_THRESHOLD,
            ),
            periods=periods,
        )


def _to_report(m: PeriodMetrics, c) -> PeriodReport:
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
