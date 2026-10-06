import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# If ambient system environment has an invalid JDBC DATABASE_URL from an unrelated Java project, ignore it
if os.environ.get("DATABASE_URL", "").startswith("jdbc:"):
    del os.environ["DATABASE_URL"]


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    CORS_ORIGINS: str = "http://localhost:3000"
    ADMIN_TOKEN: str = "change-me"
    PUBLIC_APP_URL: str = "http://localhost:3000"
    SEED_ON_STARTUP: bool = True
    AWS_REGION: str = ""
    S3_BUCKET: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
