from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # Use SettingsConfigDict to configure env file and allow ignoring extra envs. This is useful for local development where you might have other env vars that aren't relevant to the app. 

    

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
      
   
    
    # Define the settings with default values. The DATABASE_URL defaults to a local SQLite database, and OPENAI_API_KEY is set to None by default, which means it must be provided in the .env file for the chat functionality to work.
    
    DATABASE_URL: str = "sqlite:///./cricket_ai.db"
    OPENAI_API_KEY: str | None = None


settings = Settings()
