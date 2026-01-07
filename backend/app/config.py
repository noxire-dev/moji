from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
import logging
import sys


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # App
    debug: bool = False
    allowed_origins: str = "http://localhost:3000"

    @field_validator("supabase_url")
    @classmethod
    def validate_supabase_url(cls, v: str) -> str:
        """Validate that supabase_url is a valid HTTP/HTTPS URL."""
        if not v.startswith(("http://", "https://")):
            raise ValueError("supabase_url must start with http:// or https://")
        if len(v) < 10 or len(v) > 2048:
            raise ValueError("supabase_url must be between 10 and 2048 characters")
        return v

    @field_validator("supabase_anon_key")
    @classmethod
    def validate_anon_key(cls, v: str) -> str:
        """Validate that anon key has reasonable length."""
        if len(v) < 20:
            raise ValueError("supabase_anon_key appears to be too short (minimum 20 characters)")
        if len(v) > 500:
            raise ValueError("supabase_anon_key appears to be too long (maximum 500 characters)")
        return v

    @field_validator("supabase_service_key")
    @classmethod
    def validate_service_key(cls, v: str) -> str:
        """Validate that service key has reasonable length."""
        if len(v) < 20:
            raise ValueError("supabase_service_key appears to be too short (minimum 20 characters)")
        if len(v) > 500:
            raise ValueError("supabase_service_key appears to be too long (maximum 500 characters)")
        return v

    @field_validator("allowed_origins")
    @classmethod
    def validate_origins(cls, v: str) -> str:
        """Validate that allowed origins are properly formatted."""
        origins = [origin.strip() for origin in v.split(",")]
        for origin in origins:
            if not origin.startswith(("http://", "https://")):
                raise ValueError(f"Invalid origin format: {origin}. Must start with http:// or https://")
            if len(origin) > 2048:
                raise ValueError(f"Origin too long: {origin}")
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def setup_logging(debug: bool = False) -> None:
    """
    Configure structured logging for the application.

    Args:
        debug: If True, set log level to DEBUG, otherwise INFO
    """
    log_level = logging.DEBUG if debug else logging.INFO
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Set specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.INFO)
