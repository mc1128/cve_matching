"""
Authentication API Endpoints
사용자 인증 및 세션 관리를 위한 REST API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import secrets
import random
from pathlib import Path
import os

# 데이터베이스 서비스 import
try:
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
    from app.models.cve_database import UserManager
    USE_DATABASE = True
    print("✅ UserManager imported successfully")
except ImportError as e:
    USE_DATABASE = False
    print(f"⚠️ Warning: UserManager not available: {e}")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# JWT 설정
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 임시 OTP 저장소 (실제 환경에서는 Redis 등 사용)
otp_storage: Dict[str, Dict[str, Any]] = {}

# Pydantic 모델들
class EmailRequest(BaseModel):
    email: EmailStr

class OTPRequest(BaseModel):
    email: EmailStr
    otp: str

class RegisterRequest(BaseModel):
    user_name: str
    email: EmailStr
    department: Optional[str] = None
    otp: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserResponse(BaseModel):
    user_id: int
    user_name: str
    email: str
    department: Optional[str]
    created_at: datetime

# JWT 토큰 생성
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# JWT 토큰 검증
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# OTP 생성 (6자리 숫자)
def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"

@router.post("/send-otp")
async def send_otp(request: EmailRequest):
    """OTP 발송 (임시로는 실제 발송 없이 저장만)"""
    try:
        # OTP 생성
        otp = generate_otp()
        
        # 임시 저장 (10분 유효)
        otp_storage[request.email] = {
            "otp": otp,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)
        }
        
        # 실제 환경에서는 이메일 발송 로직 추가
        print(f"📧 OTP for {request.email}: {otp}")
        
        return {
            "message": "OTP sent successfully",
            "email": request.email,
            "debug_otp": otp  # 개발 환경에서만 포함
        }
        
    except Exception as e:
        print(f"❌ Error sending OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )

@router.post("/verify-otp", response_model=LoginResponse)
async def verify_otp_login(request: OTPRequest):
    """OTP 검증 및 로그인"""
    try:
        # OTP 확인
        stored_otp = otp_storage.get(request.email)
        if not stored_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP not found or expired"
            )
        
        # OTP 만료 확인
        if datetime.utcnow() > stored_otp["expires_at"]:
            del otp_storage[request.email]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP expired"
            )
        
        # OTP 검증
        if stored_otp["otp"] != request.otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # 사용자 조회
        if USE_DATABASE:
            user_manager = UserManager()
            user = user_manager.get_user_by_email(request.email)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found. Please register first."
                )
        else:
            # 모목 사용자 데이터
            user = {
                "user_id": 1,
                "user_name": "Test User",
                "email": request.email,
                "department": "IT",
                "created_at": datetime.utcnow()
            }
        
        # OTP 사용 완료 후 삭제
        del otp_storage[request.email]
        
        # JWT 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "user_id": user["user_id"]},
            expires_delta=access_token_expires
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error verifying OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify OTP"
        )

@router.post("/register", response_model=LoginResponse)
async def register_user(request: RegisterRequest):
    """신규 사용자 회원가입"""
    try:
        # OTP 확인
        stored_otp = otp_storage.get(request.email)
        if not stored_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP not found or expired"
            )
        
        # OTP 검증
        if stored_otp["otp"] != request.otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # 기존 사용자 확인
        if USE_DATABASE:
            user_manager = UserManager()
            existing_user = user_manager.get_user_by_email(request.email)
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User already exists"
                )
            
            # 새 사용자 생성
            user_id = user_manager.create_user(
                user_name=request.user_name,
                email=request.email,
                department=request.department
            )
            
            # 생성된 사용자 정보 조회
            user = user_manager.get_user_by_email(request.email)
        else:
            # 모목 사용자 생성
            user = {
                "user_id": random.randint(1, 1000),
                "user_name": request.user_name,
                "email": request.email,
                "department": request.department,
                "created_at": datetime.utcnow()
            }
        
        # OTP 사용 완료 후 삭제
        del otp_storage[request.email]
        
        # JWT 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "user_id": user["user_id"]},
            expires_delta=access_token_expires
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )

@router.post("/logout")
async def logout(current_user: str = Depends(verify_token)):
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    return {"message": "Logged out successfully"}

@router.get("/verify-session", response_model=UserResponse)
async def verify_session(current_user: str = Depends(verify_token)):
    """현재 세션 검증 및 사용자 정보 반환"""
    try:
        if USE_DATABASE:
            user_manager = UserManager()
            user = user_manager.get_user_by_email(current_user)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
        else:
            # 모목 사용자 데이터
            user = {
                "user_id": 1,
                "user_name": "Test User",
                "email": current_user,
                "department": "IT",
                "created_at": datetime.utcnow()
            }
        
        return UserResponse(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error verifying session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify session"
        )

@router.get("/otp-debug/{email}")
async def get_otp_debug(email: str):
    """개발용: 저장된 OTP 확인"""
    stored_otp = otp_storage.get(email)
    if stored_otp:
        return {
            "email": email,
            "otp": stored_otp["otp"],
            "expires_at": stored_otp["expires_at"],
            "is_expired": datetime.utcnow() > stored_otp["expires_at"]
        }
    return {"message": "No OTP found for this email"}
