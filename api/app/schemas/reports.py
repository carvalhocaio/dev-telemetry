from datetime import date

from pydantic import BaseModel

from app.analysis.classifier import Level


class PeriodReport(BaseModel):
    period: date
    level: Level
    composite: float
    components: dict[str, float]
    commit_count: int
    pr_count: int
    pr_merged: int
    additions: int
    deletions: int
    active_days: int
    merge_rate: float | None


class ReportMeta(BaseModel):
    granularity: str
    sample_size: int
    weights: dict[str, float]
    level_cuts: dict[str, float]
    small_sample: bool


class Report(BaseModel):
    meta: ReportMeta
    periods: list[PeriodReport]
