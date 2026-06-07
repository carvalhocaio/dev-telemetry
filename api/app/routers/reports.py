from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.metrics import Granularity
from app.analysis.reporting import ReportService
from app.auth import require_auth
from app.db import get_session
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
