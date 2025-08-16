from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # API Settings
    api_v1_str: str = "/api/v1"
    project_name: str = "SupplyNet"
    
    # Database
    database_url: str = "postgresql://user:password@localhost/supplynet"
    database_test_url: str = "postgresql://user:password@localhost/supplynet_test"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # ML Model Settings
    forecast_horizon_days: int = 7
    anomaly_threshold: float = 2.0
    safety_stock_multiplier: float = 1.5
    
    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: list = [".csv", ".xlsx", ".xls"]
    
    # External APIs
    mapbox_token: Optional[str] = None
    weather_api_key: Optional[str] = None
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Override with environment variables if present
if os.getenv("DATABASE_URL"):
    settings.database_url = os.getenv("DATABASE_URL")
if os.getenv("REDIS_URL"):
    settings.redis_url = os.getenv("REDIS_URL")
if os.getenv("SECRET_KEY"):
    settings.secret_key = os.getenv("SECRET_KEY")
