from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.content import ContentService
from app.analysis.llm import MODEL, NarrativeGenerator
from app.analysis.metrics import Granularity
from app.analysis.reporting import ReportService
from app.schemas.narrative import NarrativeResponse


class NarrativeService:
    def __init__(self, session: AsyncSession, *, include_patches: bool = False) -> None:
        self._report = ReportService(session)
        self._content = ContentService(session)
        self._include_patches = include_patches

    async def build(
        self, granularity: Granularity, period: date
    ) -> NarrativeResponse | None:
        report = await self._report.build(granularity)
        match = next((p for p in report.periods if p.period == period), None)
        if match is None:
            return None

        content = await self._content.fetch(granularity, period)

        generator = NarrativeGenerator(include_patches=self._include_patches)
        try:
            narrative = await generator.generate(
                period=period.isoformat(),
                level=match.level,
                commit_messages=content.commit_messages,
                pr_texts=content.pr_texts,
                patches=content.patches,
            )
        finally:
            await generator.aclose()

        return NarrativeResponse(
            period=period.isoformat(),
            level=match.level.value,
            model=MODEL,
            narrative=narrative,
        )
