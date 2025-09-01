"""
CVE Matching System - FastAPI Application
보안취약점 자동조치 AGENT Backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# App 설정
app = FastAPI(
    title="CVE Matching System",
    description="보안취약점 자동조치 AGENT Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 구체적인 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "CVE Matching System API",
        "version": "1.0.0",
        "status": "running",
        "description": "보안취약점 자동조치 AGENT Backend"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}

@app.get("/api/info")
async def api_info():
    """API 정보 엔드포인트"""
    return {
        "name": "CVE Matching System",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import uvicorn
import logging
from datetime import datetime
import sys
import os

# 현재 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import CVEDatabase, test_connection

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="CVE Matching System",
    description="보안취약점 자동조치 AGENT",
    version="1.0.0"
)

# Pydantic 모델들
class ChatMessage(BaseModel):
    user_id: str
    prompt: str

class ChatResponse(BaseModel):
    id: int
    response: str
    timestamp: datetime

class CVERecord(BaseModel):
    cve_id: str
    title: str
    description: Optional[str] = None
    severity: str
    cvss_score: Optional[float] = None
    published_date: Optional[str] = None
    last_modified: Optional[str] = None
    affected_systems: List[str] = []

class SystemStatus(BaseModel):
    database_connected: bool
    database_info: Dict[str, Any]
    timestamp: datetime

# 라우트 정의
@app.get("/", response_class=HTMLResponse)
async def root():
    """메인 페이지"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>CVE Matching System</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
            .status { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .api-section { margin: 30px 0; }
            .endpoint { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .method { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; margin-right: 10px; }
            .get { background: #27ae60; }
            .post { background: #e74c3c; }
            code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
            .footer { margin-top: 40px; text-align: center; color: #7f8c8d; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛡️ CVE Matching System</h1>
            <p><strong>보안취약점 자동조치 AGENT</strong></p>
            
            <div class="status">
                <h3>📊 시스템 상태</h3>
                <p>시스템 상태를 확인하려면 <a href="/status">/status</a> 엔드포인트를 방문하세요.</p>
            </div>
            
            <div class="api-section">
                <h3>🔌 API 엔드포인트</h3>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <strong>/status</strong>
                    <p>시스템 및 데이터베이스 연결 상태 확인</p>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <strong>/cve/records</strong>
                    <p>CVE 레코드 목록 조회 (쿼리 파라미터: severity, limit)</p>
                </div>
                
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <strong>/cve/records</strong>
                    <p>새로운 CVE 레코드 추가</p>
                </div>
                
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <strong>/chat</strong>
                    <p>채팅 메시지 전송 및 응답 받기</p>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <strong>/chat/history/{user_id}</strong>
                    <p>사용자 채팅 기록 조회</p>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <strong>/docs</strong>
                    <p>Swagger UI API 문서</p>
                </div>
            </div>
            
            <div class="footer">
                <p>🐍 Python FastAPI + 🐘 PostgreSQL Aurora</p>
                <p>CVE Matching System v1.0.0</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/status", response_model=SystemStatus)
async def get_status():
    """시스템 상태 확인"""
    db_result = test_connection()
    
    return SystemStatus(
        database_connected=db_result['success'],
        database_info=db_result,
        timestamp=datetime.now()
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """채팅 메시지 처리"""
    try:
        # 간단한 응답 생성 (실제로는 AI 모델을 사용)
        response_text = f"안녕하세요 {message.user_id}님! '{message.prompt}'에 대한 응답입니다. CVE 관련 질문이시면 더 자세히 도와드릴 수 있습니다."
        
        # 데이터베이스에 저장
        chat_id = CVEDatabase.add_chat_message(
            message.user_id, 
            message.prompt, 
            response_text
        )
        
        return ChatResponse(
            id=chat_id,
            response=response_text,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"채팅 처리 오류: {e}")
        raise HTTPException(status_code=500, detail="채팅 처리 중 오류가 발생했습니다.")

@app.get("/chat/history/{user_id}")
async def get_chat_history(user_id: str, limit: int = 10):
    """채팅 기록 조회"""
    try:
        history = CVEDatabase.get_chat_history(user_id, limit)
        return {"user_id": user_id, "history": history}
    except Exception as e:
        logger.error(f"채팅 기록 조회 오류: {e}")
        raise HTTPException(status_code=500, detail="채팅 기록 조회 중 오류가 발생했습니다.")

@app.get("/cve/records")
async def get_cve_records(severity: Optional[str] = None, limit: int = 50):
    """CVE 레코드 조회"""
    try:
        records = CVEDatabase.get_cve_records(severity, limit)
        return {"records": records, "count": len(records)}
    except Exception as e:
        logger.error(f"CVE 레코드 조회 오류: {e}")
        raise HTTPException(status_code=500, detail="CVE 레코드 조회 중 오류가 발생했습니다.")

@app.post("/cve/records")
async def add_cve_record(cve: CVERecord):
    """CVE 레코드 추가"""
    try:
        cve_id = CVEDatabase.add_cve_record(cve.dict())
        return {"message": "CVE 레코드가 성공적으로 추가되었습니다.", "id": cve_id}
    except Exception as e:
        logger.error(f"CVE 레코드 추가 오류: {e}")
        raise HTTPException(status_code=500, detail="CVE 레코드 추가 중 오류가 발생했습니다.")

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행"""
    logger.info("🚀 CVE Matching System 시작...")
    
    # 데이터베이스 연결 테스트
    db_result = test_connection()
    if db_result['success']:
        logger.info("✅ 데이터베이스 연결 확인")
        # 테이블 생성
        try:
            CVEDatabase.create_tables()
            logger.info("✅ 데이터베이스 테이블 준비 완료")
        except Exception as e:
            logger.error(f"❌ 테이블 생성 실패: {e}")
    else:
        logger.error(f"❌ 데이터베이스 연결 실패: {db_result['error']}")

if __name__ == "__main__":
    # 개발 서버 실행
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
