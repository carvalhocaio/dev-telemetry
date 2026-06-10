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


class Coverage(BaseModel):
    first: date | None
    last: date | None


class ReportMeta(BaseModel):
    granularity: str
    sample_size: int
    weights: dict[str, float]
    level_cuts: dict[str, float]
    small_sample: bool
    coverage: Coverage


class WindowSummary(BaseModel):
    start: date | None
    end: date | None
    level: Level
    composite: float
    commit_count: int
    pr_count: int
    pr_merged: int
    additions: int
    deletions: int
    active_days: int
    partial_current: bool


class Report(BaseModel):
    meta: ReportMeta
    window: WindowSummary
    periods: list[PeriodReport]
