from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_sqlite_url(value: str) -> str:
    if not isinstance(value, str) or not value.startswith("sqlite:///"):
        return value

    raw_path = value.removeprefix("sqlite:///")
    path = Path(raw_path)

    if not path.is_absolute():
        candidates = [
            Path.cwd() / path,
            Path(__file__).resolve().parents[2] / path,
            Path(__file__).resolve().parents[3] / path,
        ]

        for candidate in candidates:
            if candidate.exists():
                path = candidate.resolve()
                break

    return f"sqlite:///{path.resolve()}"


class Settings(BaseSettings):
    # Use SettingsConfigDict to configure env file and allow ignoring extra envs.
    # This is useful for local development with mixed environment variables.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./cricket_ai.db"
    OPENAI_API_KEY: str | None = None

    def __init__(self, **values):
        super().__init__(**values)
        self.DATABASE_URL = _resolve_sqlite_url(self.DATABASE_URL)


settings = Settings()
