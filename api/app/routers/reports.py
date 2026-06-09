from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.metrics import Granularity
from app.analysis.narrative_service import NarrativeService
from app.analysis.reporting import ReportService
from app.auth import require_auth
from app.db import get_session
from app.schemas.narrative import NarrativeResponse
from app.schemas.reports import Report

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    dependencies=[Depends(require_auth)],
)

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("/{granularity}", response_model=Report)
async def get_report(granularity: Granularity, session: SessionDep) -> Report:
    return await ReportService(session).build(granularity)


@router.get("/{granularity}/{period}/narrative", response_model=NarrativeResponse)
async def get_narrative(
    granularity: Granularity, period: date, session: SessionDep
) -> NarrativeResponse:
    result = await NarrativeService(session).build(granularity, period)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Nenhum período {granularity.value} encontrado "
                f"em {period.isoformat()}."
            ),
        )
    return result
