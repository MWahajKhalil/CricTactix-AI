from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Default to SQLite for easy local setup if Postgres isn't configured
    DATABASE_URL: str = "sqlite:///./cricket_ai.db"
    
    class Config:
        env_file = ".env"

settings = Settings()
