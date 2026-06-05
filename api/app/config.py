from functools import lru_cache
from pathlib import Path

from pydantic import ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "dev-telemetry"
    debug: bool = False
    auth_password: str
    github_token: str
    github_org: str
    github_username: str
    database_url: str
    gemini_api_key: str


@lru_cache
def get_settings() -> Settings:
    try:
        return Settings()  # type: ignore[call-arg]
    except ValidationError as e:
        missing_fields = [
            str(error["loc"][0]).upper()
            for error in e.errors()
            if error["type"] == "missing"
        ]
        if missing_fields:
            error_msg = (
                "The following required environment variables are not set: "
                f"{', '.join(missing_fields)}. "
                "Please create a .env file in the project root (api/.env) and set them."
            )
            raise ValueError(error_msg) from e
        raise e
