# Database Configuration and Models
"""
PostgreSQL 데이터베이스 연결 및 모델 정의
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
import os

# fastapi_main.py에서 이미 환경 변수가 로드되었으므로 여기서는 생략

# 환경 변수에서 AWS Aurora PostgreSQL 설정 가져오기
# AWS Aurora PostgreSQL 연결 정보
DB_HOST = os.getenv("DB_HOST", "localhost")  # Aurora 클러스터 엔드포인트
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

# Aurora PostgreSQL 연결 URL 구성
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# SQLAlchemy 설정
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 데이터베이스 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# 모델 정의
# ============================================================================

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계
    assets = relationship("Asset", back_populates="owner")

class Asset(Base):
    __tablename__ = "assets"
    
    asset_id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), nullable=False, index=True)
    ip_address = Column(String(45), index=True)
    asset_type = Column(String(50), nullable=False, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.user_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계
    owner = relationship("User", back_populates="assets")
    components = relationship("AssetComponent", back_populates="asset")

class AssetComponent(Base):
    __tablename__ = "asset_components"
    
    component_id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    component_type = Column(String(50), nullable=False)  # Software, Hardware, OS
    vendor = Column(String(255))
    product = Column(String(255), nullable=False)
    version = Column(String(100))
    cpe_full_string = Column(Text, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계
    asset = relationship("Asset", back_populates="components")

class CVEMaster(Base):
    __tablename__ = "cve_master"
    
    cve_id = Column(String(50), primary_key=True)
    cvss_score = Column(Numeric(3, 1))
    description = Column(Text)
    status = Column(String(50), default="New")
    is_favorite = Column(Boolean, default=False)
    published_date = Column(DateTime(timezone=True))
    last_modified_date = Column(DateTime(timezone=True))
    cvss_severity = Column(String(20), index=True)
    cvss_vector = Column(Text)
    weakness_type_cwe = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계
    affected_cpes = relationship("CVEAffectedCPE", back_populates="cve")
    references = relationship("CVEReference", back_populates="cve")

class CVEAffectedCPE(Base):
    __tablename__ = "cve_affected_cpes"
    
    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String(50), ForeignKey("cve_master.cve_id"), nullable=False)
    cpe_full_string = Column(Text, nullable=False, index=True)
    vendor = Column(String(255))
    product = Column(String(255))
    version = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    cve = relationship("CVEMaster", back_populates="affected_cpes")

class CVEReference(Base):
    __tablename__ = "cve_references"
    
    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String(50), ForeignKey("cve_master.cve_id"), nullable=False)
    url = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    cve = relationship("CVEMaster", back_populates="references")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

# ============================================================================
# Pydantic 스키마 (API 응답용)
# ============================================================================

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AssetComponentSchema(BaseModel):
    component_id: int
    component_type: str
    vendor: Optional[str]
    product: str
    version: Optional[str]
    cpe_full_string: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserSchema(BaseModel):
    user_id: int
    user_name: str
    email: str
    department: Optional[str]
    
    class Config:
        from_attributes = True

class AssetSchema(BaseModel):
    asset_id: int
    hostname: str
    ip_address: Optional[str]
    asset_type: str
    owner: Optional[UserSchema]
    components: List[AssetComponentSchema] = []
    created_at: datetime
    updated_at: datetime
    
    # CVE 통계 (계산 필드)
    critical_cves: int = 0
    high_cves: int = 0
    medium_cves: int = 0
    low_cves: int = 0
    last_scan: Optional[datetime] = None
    status: str = "unknown"
    
    class Config:
        from_attributes = True

class CVESchema(BaseModel):
    cve_id: str
    cvss_score: Optional[float]
    description: Optional[str]
    status: str
    cvss_severity: Optional[str]
    published_date: Optional[datetime]
    
    class Config:
        from_attributes = True
