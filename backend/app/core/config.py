"""
Core configuration settings for CVE Matching System
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 기본 설정
    APP_NAME: str = "CVE Matching System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # 데이터베이스 설정
    RDS_HOST: str
    RDS_USER: str
    RDS_PASSWORD: str
    RDS_DATABASE: str
    RDS_PORT: int = 5432
    
    # AWS 설정
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # 외부 API 설정
    NVD_API_KEY: Optional[str] = None
    NVD_API_URL: str = "https://services.nvd.nist.gov/rest/json"
    
    # Redis 설정 (Celery용)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # 이메일 설정
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # 로깅 설정
    LOG_LEVEL: str = "INFO"
    
    @property
    def database_url(self) -> str:
        """데이터베이스 연결 URL"""
        return f"postgresql://{self.RDS_USER}:{self.RDS_PASSWORD}@{self.RDS_HOST}:{self.RDS_PORT}/{self.RDS_DATABASE}"
    
    class Config:
        env_file = ".env.local"
        case_sensitive = True


settings = Settings()
