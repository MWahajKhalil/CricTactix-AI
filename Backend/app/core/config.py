#this file is responsible for loading configuration settings for the application, such as database connection strings and API keys. It uses pydantic's BaseSettings to define the settings and allows for environment variable overrides. The _resolve_sqlite_url function is a helper to ensure that SQLite database paths are correctly resolved, especially when using relative paths in the DATABASE_URL setting.


from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

#this function resolves the SQLite database URL, especially when using relative paths. It checks multiple potential locations for the database file to ensure it can be found regardless of the current working directory. This is particularly useful for development environments where the location of the database file may vary. If the DATABASE_URL does not start with "sqlite:///", it returns the value unchanged, allowing for other types of databases to be used without modification.


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


def _resolve_backend_path(value: str) -> str:
    if not isinstance(value, str):
        return value
    path = Path(value)
    if not path.is_absolute():
        clean_val = value.removeprefix("./")
        if clean_val.startswith("Backend/"):
            workspace_root = Path(__file__).resolve().parents[3]
            resolved_path = workspace_root / clean_val
        else:
            backend_root = Path(__file__).resolve().parents[2]
            resolved_path = backend_root / path
        return str(resolved_path.resolve())
    return str(path.resolve())


class Settings(BaseSettings):
    # Use SettingsConfigDict to configure env file and allow ignoring extra envs.
    # This is useful for local development with mixed environment variables.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./cricket_ai.db"
    OPENAI_API_KEY: str | None = None
    CHROMA_DB_PATH: str = "./Backend/data/chroma_db"
    REPORTS_DIR: str = "./Backend/data/reports"

    def __init__(self, **values):
        super().__init__(**values)
        self.DATABASE_URL = _resolve_sqlite_url(self.DATABASE_URL)
        self.CHROMA_DB_PATH = _resolve_backend_path(self.CHROMA_DB_PATH)
        self.REPORTS_DIR = _resolve_backend_path(self.REPORTS_DIR)


settings = Settings()
