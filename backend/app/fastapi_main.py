"""
CVE Matching System - FastAPI Application
보안취약점 자동조치 AGENT Backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from pathlib import Path
import os

# 환경변수 로드 - 프로젝트 루트의 .env 파일을 명시적으로 지정
root_dir = Path(__file__).resolve().parents[2]  # backend/app/fastapi_main.py -> backend -> cve_matching
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

print(f"🔍 Loading .env from: {env_path}")
print(f"🔍 DB_HOST: {os.getenv('DB_HOST', 'NOT_FOUND')}")

# API 라우터 import
from app.api.cpe_endpoints import router as cve_router

# App 설정
app = FastAPI(
    title="CVE Matching System",
    description="보안취약점 자동조치 AGENT Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
# origins = [
#     "http://localhost",
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
# ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(cve_router)

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "CVE Matching System API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app.fastapi_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
