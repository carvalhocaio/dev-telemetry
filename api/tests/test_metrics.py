from datetime import date

from app.analysis.metrics import Granularity, bucket_start


class TestBucketStart:
    def test_daily_is_the_day_itself(self) -> None:
        day = date(2026, 6, 10)
        assert bucket_start(Granularity.DAILY, day) == day

    def test_weekly_snaps_back_to_monday(self) -> None:
        # 2026-06-10 is a Wednesday; the ISO week starts Monday 2026-06-08.
        assert bucket_start(Granularity.WEEKLY, date(2026, 6, 10)) == date(2026, 6, 8)

    def test_weekly_on_a_monday_is_unchanged(self) -> None:
        monday = date(2026, 6, 8)
        assert bucket_start(Granularity.WEEKLY, monday) == monday

    def test_weekly_on_a_sunday_snaps_to_the_previous_monday(self) -> None:
        # 2026-06-14 is a Sunday; date_trunc('week') keeps the Monday before it.
        assert bucket_start(Granularity.WEEKLY, date(2026, 6, 14)) == date(2026, 6, 8)

    def test_monthly_snaps_to_the_first_of_the_month(self) -> None:
        assert bucket_start(Granularity.MONTHLY, date(2026, 6, 10)) == date(2026, 6, 1)
