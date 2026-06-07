import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

_bearer = HTTPBearer(auto_error=True)
BeareDep = Annotated[HTTPAuthorizationCredentials, Depends(_bearer)]


async def require_auth(credentials: BeareDep) -> None:
    settings = get_settings()
    is_valid = secrets.compare_digest(
        credentials.credentials.encode(),
        settings.auth_password.encode(),
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
