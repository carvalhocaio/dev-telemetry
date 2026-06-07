from dataclasses import dataclass
from datetime import date
from enum import Enum

from app.analysis.metrics import PeriodMetrics


class Level(str, Enum):
    BELOW = "abaixo"
    MEETING = "atendendo"
    ABOVE = "acima"
    WELL_ABOVE = "muito_acima"


WEIGHTS: dict[str, float] = {
    "throughput": 0.45,
    "active_days": 0.35,
    "churn": 0.20,
}

_LEVEL_CUTS: tuple[tuple[float, Level], ...] = (
    (0.20, Level.BELOW),
    (0.70, Level.MEETING),
    (0.90, Level.ABOVE),
)

_NEUTRAL_RANK = 0.5


@dataclass(frozen=True, slots=True)
class PeriodClassification:
    period: date
    level: Level
    composite: float
    components: dict[str, float]


class Classifier:
    def classify(self, periods: list[PeriodMetrics]) -> list[PeriodClassification]:
        if not periods:
            return []

        throughput = [float(p.throughput) for p in periods]
        active = [float(p.active_days) for p in periods]
        churn = [float(p.churn) for p in periods]

        results: list[PeriodClassification] = []
        for p in periods:
            components = {
                "throughput": _percentile_rank(float(p.throughput), throughput),
                "active_days": _percentile_rank(float(p.active_days), active),
                "churn": _percentile_rank(float(p.churn), churn),
            }
            composite = sum(WEIGHTS[k] * v for k, v in components.items())
            results.append(
                PeriodClassification(
                    period=p.period,
                    level=self._to_level(composite),
                    composite=composite,
                    components=components,
                )
            )
        return results

    @staticmethod
    def _to_level(composite: float) -> Level:
        for upper, level in _LEVEL_CUTS:
            if composite < upper:
                return level
        return Level.WELL_ABOVE


def _percentile_rank(value: float, population: list[float]) -> float:
    n = len(population)
    if n <= 1:
        return _NEUTRAL_RANK
    below = sum(1 for x in population if x < value)
    equal = sum(1 for x in population if x == value)
    return (below + 0.5 * equal) / n
