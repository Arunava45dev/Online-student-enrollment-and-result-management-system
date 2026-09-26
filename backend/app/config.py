from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str = "enrollment_db"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    OPENAI_API_KEY: str
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    RESET_OTP_EXPIRE_MINUTES: int = 10
    RESET_OTP_MAX_ATTEMPTS: int = 5
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None

    class Config:
        env_file = str(ENV_FILE)
        extra = "ignore"

settings = Settings()
