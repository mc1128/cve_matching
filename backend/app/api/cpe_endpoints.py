"""
CVE Dashboard API Endpoints
프론트엔드와 연동을 위한 REST API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel
import json
import re

# 데이터베이스 서비스 import
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
    from app.services.database_service import get_db_service, DatabaseService
    from app.services.cache_service import invalidate_component_cache, get_cache_info, cache
    from app.api.auth_endpoints import verify_token  # JWT 토큰 검증 함수 import
    USE_DATABASE = True
    print("✅ Database service imported successfully")
except ImportError as e:
    USE_DATABASE = False
    print(f"⚠️ Warning: Database service not available: {e}")
except Exception as e:
    USE_DATABASE = False
    print(f"⚠️ Warning: Database service error: {e}")

router = APIRouter(prefix="/api", tags=["CVE Dashboard"])

# Pydantic 모델들
class AssetCreateRequest(BaseModel):
    hostname: str
    ip_address: str
    asset_type: str

class AssetUpdateRequest(BaseModel):
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    asset_type: Optional[str] = None

# Mock 데이터 생성 함수들
def get_dashboard_stats() -> List[Dict[str, Any]]:
    """대시보드 통계 데이터 반환"""
    return [
        {
            "label": "TODAY'S NEW CVE",
            "value": "23",
            "description": "NEWLY DISCOVERED VULNERABILITIES",
            "intent": "negative",
            "icon": "gear",
            "direction": "up"
        },
        {
            "label": "ANALYSIS PENDING",
            "value": "156",
            "description": "AWAITING AI ANALYSIS",
            "intent": "neutral",
            "icon": "proccesor",
            "tag": "HIGH PRIORITY"
        },
        {
            "label": "CRITICAL ASSETS",
            "value": "7",
            "description": "CVSS 9.0+ VULNERABILITIES",
            "intent": "negative",
            "icon": "boom",
            "direction": "up"
        }
    ]

def get_chart_data() -> Dict[str, Any]:
    """차트 데이터 반환"""
    base_data = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        base_data.append({
            "date": date,
            "critical": 5 + i,
            "high": 12 + (i * 2),
            "medium": 25 + (i * 3),
            "spendings": 100 + (i * 10),
            "sales": 200 + (i * 15),
            "coffee": 50 + (i * 5)
        })
    
    return {
        "week": base_data,
        "month": base_data * 4,
        "year": base_data * 52
    }

def get_device_list() -> List[Dict[str, Any]]:
    """디바이스 목록 반환 - 프론트엔드 Device 인터페이스와 일치하는 구조"""
    return [
        {
            "asset_id": 1,
            "hostname": "WebServer-Prod-01",
            "ip_address": "192.168.1.10",
            "asset_type": "Server",
            "owner_name": "KRIMSON",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-20T14:22:00Z"
        },
        {
            "asset_id": 2,
            "hostname": "DB-Server-Main",
            "ip_address": "192.168.1.20",
            "asset_type": "Server",
            "owner_name": "MATI",
            "created_at": "2024-01-10T09:15:00Z",
            "updated_at": "2024-01-18T16:45:00Z"
        },
        {
            "asset_id": 3,
            "hostname": "Workstation-Dev-01",
            "ip_address": "192.168.1.100",
            "asset_type": "Laptop",
            "owner_name": "PEK",
            "created_at": "2024-01-12T11:20:00Z",
            "updated_at": "2024-01-19T13:30:00Z"
        },
        {
            "asset_id": 4,
            "hostname": "Router-Gateway",
            "ip_address": "192.168.1.1",
            "asset_type": "Server",
            "owner_name": "JOYBOY",
            "created_at": "2024-01-08T08:00:00Z",
            "updated_at": "2024-01-22T10:15:00Z"
        }
    ]

def get_recent_cves() -> List[Dict[str, Any]]:
    """최근 발견된 CVE 목록"""
    return [
        {
            "id": "CVE-2025-0001",
            "title": "Critical Buffer Overflow in OpenSSL",
            "description": "A critical buffer overflow vulnerability in OpenSSL library",
            "cvss_score": 9.8,
            "severity": "CRITICAL",
            "published_date": "2025-09-01T14:30:00Z",
            "affected_products": ["OpenSSL 3.x", "Apache 2.4"],
            "status": "new"
        },
        {
            "id": "CVE-2025-0002",
            "title": "SQL Injection in MySQL",
            "description": "SQL injection vulnerability in MySQL server",
            "cvss_score": 7.5,
            "severity": "HIGH",
            "published_date": "2025-09-01T12:15:00Z",
            "affected_products": ["MySQL 8.0", "MariaDB 10.x"],
            "status": "analyzing"
        }
    ]

# 🔥 사용자별 자산 관리 헬퍼 함수
def get_user_id_from_email(email: str, db_service: DatabaseService) -> Optional[int]:
    """이메일로 사용자 ID 조회"""
    try:
        query = "SELECT user_id FROM users WHERE email = %s"
        result = db_service.execute_query(query, (email,))
        if result and len(result) > 0:
            # execute_query는 tuple의 리스트를 반환하므로 첫 번째 tuple의 첫 번째 요소를 반환
            return result[0][0]
        return None
    except Exception as e:
        print(f"Error getting user ID: {e}")
        return None

# API 엔드포인트들
@router.get("/dashboard/stats")
async def dashboard_stats(db_service: DatabaseService = Depends(get_db_service)):
    """대시보드 통계 API"""
    try:
        if USE_DATABASE and db_service.test_connection():
            stats = db_service.get_dashboard_stats()
            dashboard_data = get_dashboard_stats()
            dashboard_data[0]["value"] = str(stats.get("today_new_cves", 23))
            dashboard_data[1]["value"] = str(stats.get("pending_analysis", 156))
            dashboard_data[2]["value"] = str(stats.get("critical_cves", 8))
            
            return {
                "success": True,
                "data": dashboard_data,
                "total": len(dashboard_data),
                "timestamp": datetime.now().isoformat(),
                "source": "database"
            }
        else:
            mock_data = get_dashboard_stats()
            return {
                "success": True,
                "data": mock_data,
                "total": len(mock_data),
                "timestamp": datetime.now().isoformat(),
                "source": "mock"
            }
    except Exception as e:
        mock_data = get_dashboard_stats()
        return {
            "success": True,
            "data": mock_data,
            "total": len(mock_data),
            "timestamp": datetime.now().isoformat(),
            "source": "mock_fallback",
            "error": str(e)
        }

@router.get("/cve/dashboard-stats")
async def cve_dashboard_stats(db_service: DatabaseService = Depends(get_db_service)):
    """CVE 대시보드 통계 API - 프론트엔드 호환"""
    return await dashboard_stats(db_service)

@router.get("/cve/chart-data")
async def chart_data(period: str = "week"):
    """차트 데이터 API"""
    try:
        data = get_chart_data()
        if period not in data:
            raise HTTPException(status_code=400, detail="Invalid period")
        
        return {
            "success": True,
            "data": data[period],
            "period": period,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 🔥 로그인한 사용자의 자산만 조회하는 API
@router.get("/devices")
async def devices_list(
    current_user_email: str = Depends(verify_token),
    db_service: DatabaseService = Depends(get_db_service)
):
    """로그인한 사용자의 디바이스 목록 API"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # 현재 사용자의 ID 조회
            user_id = get_user_id_from_email(current_user_email, db_service)
            
            if user_id is None:
                raise HTTPException(status_code=404, detail="User not found")
            
            # 해당 사용자의 자산만 조회
            query = """
                SELECT 
                    a.asset_id,
                    a.hostname,
                    a.ip_address,
                    a.asset_type,
                    u.user_name as owner_name,
                    a.created_at,
                    a.updated_at
                FROM assets a
                LEFT JOIN users u ON a.owner_user_id = u.user_id
                WHERE a.owner_user_id = %s
                ORDER BY a.created_at DESC
            """
            
            devices_data = db_service.execute_query(query, (user_id,))
            
            # 결과를 dictionary 형태로 변환 (execute_query는 항상 tuple의 리스트를 반환)
            column_names = ['asset_id', 'hostname', 'ip_address', 'asset_type', 'owner_name', 'created_at', 'updated_at']
            devices_list = []
            for row in devices_data:
                device_dict = dict(zip(column_names, row))
                devices_list.append(device_dict)
            
            # 날짜 포맷 변환
            for device in devices_list:
                if device.get('created_at'):
                    # datetime 객체를 ISO 형식 문자열로 변환
                    if hasattr(device['created_at'], 'isoformat'):
                        device['created_at'] = device['created_at'].isoformat()
                if device.get('updated_at'):
                    # datetime 객체를 ISO 형식 문자열로 변환
                    if hasattr(device['updated_at'], 'isoformat'):
                        device['updated_at'] = device['updated_at'].isoformat()
            
            return {
                "success": True,
                "data": devices_list,
                "total": len(devices_list),
                "timestamp": datetime.now().isoformat(),
                "source": "database",
                "user_id": user_id
            }
        else:
            # 데이터베이스 연결 실패 시 Mock 데이터
            mock_data = get_device_list()
            return {
                "success": False,
                "data": mock_data,
                "total": len(mock_data),
                "timestamp": datetime.now().isoformat(),
                "source": "mock_db_connection_failed",
                "error": "Database connection failed"
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in devices_list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch devices: {str(e)}")

# 🔥 자산 추가 API
@router.post("/devices")
async def create_asset(
    asset_data: AssetCreateRequest,
    current_user_email: str = Depends(verify_token),
    db_service: DatabaseService = Depends(get_db_service)
):
    """새 자산 추가 API"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # 현재 사용자의 ID 조회
            user_id = get_user_id_from_email(current_user_email, db_service)
            
            if user_id is None:
                raise HTTPException(status_code=404, detail="User not found")
            
            # 새 자산 추가
            insert_query = """
                INSERT INTO assets (hostname, ip_address, asset_type, owner_user_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, NOW(), NOW())
                RETURNING asset_id, created_at, updated_at
            """
            
            result = db_service.execute_query(
                insert_query, 
                (asset_data.hostname, asset_data.ip_address, asset_data.asset_type, user_id)
            )
            
            # INSERT는 DML이므로 빈 리스트가 반환됨
            # 마지막으로 생성된 자산을 조회
            select_query = """
                SELECT 
                    a.asset_id,
                    a.hostname,
                    a.ip_address,
                    a.asset_type,
                    u.user_name as owner_name,
                    a.created_at,
                    a.updated_at
                FROM assets a
                LEFT JOIN users u ON a.owner_user_id = u.user_id
                WHERE a.owner_user_id = %s
                ORDER BY a.created_at DESC
                LIMIT 1
            """
            
            asset_details = db_service.execute_query(select_query, (user_id,))
            
            if asset_details and len(asset_details) > 0:
                # tuple을 dictionary로 변환
                column_names = ['asset_id', 'hostname', 'ip_address', 'asset_type', 'owner_name', 'created_at', 'updated_at']
                asset_info = dict(zip(column_names, asset_details[0]))
                
                # 날짜 포맷 변환
                if asset_info.get('created_at') and hasattr(asset_info['created_at'], 'isoformat'):
                    asset_info['created_at'] = asset_info['created_at'].isoformat()
                if asset_info.get('updated_at') and hasattr(asset_info['updated_at'], 'isoformat'):
                    asset_info['updated_at'] = asset_info['updated_at'].isoformat()
                
                return {
                    "success": True,
                    "message": "Asset created successfully",
                    "data": asset_info,
                    "timestamp": datetime.now().isoformat()
                }
            
            raise HTTPException(status_code=500, detail="Failed to create asset")
            
        else:
            raise HTTPException(status_code=503, detail="Database service unavailable")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating asset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create asset: {str(e)}")

# 🔥 자산 수정 API
@router.put("/devices/{asset_id}")
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdateRequest,
    current_user_email: str = Depends(verify_token),
    db_service: DatabaseService = Depends(get_db_service)
):
    """자산 수정 API"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # 현재 사용자의 ID 조회
            user_id = get_user_id_from_email(current_user_email, db_service)
            
            if user_id is None:
                raise HTTPException(status_code=404, detail="User not found")
            
            # 자산 소유권 확인
            check_query = "SELECT asset_id FROM assets WHERE asset_id = %s AND owner_user_id = %s"
            ownership_check = db_service.execute_query(check_query, (asset_id, user_id))
            
            if not ownership_check:
                raise HTTPException(status_code=403, detail="Not authorized to modify this asset")
            
            # 업데이트할 필드들 준비
            update_fields = []
            update_values = []
            
            if asset_data.hostname is not None:
                update_fields.append("hostname = %s")
                update_values.append(asset_data.hostname)
            
            if asset_data.ip_address is not None:
                update_fields.append("ip_address = %s")
                update_values.append(asset_data.ip_address)
            
            if asset_data.asset_type is not None:
                update_fields.append("asset_type = %s")
                update_values.append(asset_data.asset_type)
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            update_fields.append("updated_at = NOW()")
            update_values.append(asset_id)
            
            # 자산 업데이트
            update_query = f"""
                UPDATE assets 
                SET {', '.join(update_fields)}
                WHERE asset_id = %s
                RETURNING updated_at
            """
            
            result = db_service.execute_query(update_query, update_values)
            
            # UPDATE 쿼리가 성공적으로 실행됨 (DML 쿼리는 빈 리스트 반환)
            # 업데이트된 자산 정보 조회
            select_query = """
                SELECT 
                    a.asset_id,
                    a.hostname,
                    a.ip_address,
                    a.asset_type,
                    u.user_name as owner_name,
                    a.created_at,
                    a.updated_at
                FROM assets a
                LEFT JOIN users u ON a.owner_user_id = u.user_id
                WHERE a.asset_id = %s
            """
            
            asset_details = db_service.execute_query(select_query, (asset_id,))
            
            if asset_details and len(asset_details) > 0:
                # tuple을 dictionary로 변환
                column_names = ['asset_id', 'hostname', 'ip_address', 'asset_type', 'owner_name', 'created_at', 'updated_at']
                asset_info = dict(zip(column_names, asset_details[0]))
                
                # 날짜 포맷 변환
                if asset_info.get('created_at') and hasattr(asset_info['created_at'], 'isoformat'):
                    asset_info['created_at'] = asset_info['created_at'].isoformat()
                if asset_info.get('updated_at') and hasattr(asset_info['updated_at'], 'isoformat'):
                    asset_info['updated_at'] = asset_info['updated_at'].isoformat()
                
                return {
                    "success": True,
                    "message": "Asset updated successfully",
                    "data": asset_info,
                    "timestamp": datetime.now().isoformat()
                }
            
            raise HTTPException(status_code=500, detail="Failed to update asset")
            
        else:
            raise HTTPException(status_code=503, detail="Database service unavailable")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating asset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update asset: {str(e)}")

# 🔥 자산 삭제 API
@router.delete("/devices/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user_email: str = Depends(verify_token),
    db_service: DatabaseService = Depends(get_db_service)
):
    """자산 삭제 API"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # 현재 사용자의 ID 조회
            user_id = get_user_id_from_email(current_user_email, db_service)
            
            if user_id is None:
                raise HTTPException(status_code=404, detail="User not found")
            
            # 자산 소유권 확인
            check_query = """
                SELECT a.asset_id, a.hostname 
                FROM assets a 
                WHERE a.asset_id = %s AND a.owner_user_id = %s
            """
            ownership_check = db_service.execute_query(check_query, (asset_id, user_id))
            
            if not ownership_check:
                raise HTTPException(status_code=403, detail="Not authorized to delete this asset")
            
            # tuple을 처리 (asset_id, hostname)
            asset_hostname = ownership_check[0][1]
            
            # 관련 컴포넌트들 먼저 삭제
            delete_components_query = "DELETE FROM asset_components WHERE asset_id = %s"
            db_service.execute_query(delete_components_query, (asset_id,))
            
            # 자산 삭제
            delete_asset_query = "DELETE FROM assets WHERE asset_id = %s"
            result = db_service.execute_query(delete_asset_query, (asset_id,))
            
            return {
                "success": True,
                "message": f"Asset '{asset_hostname}' deleted successfully",
                "deleted_asset_id": asset_id,
                "timestamp": datetime.now().isoformat()
            }
            
        else:
            raise HTTPException(status_code=503, detail="Database service unavailable")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting asset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete asset: {str(e)}")

# 기존 엔드포인트들 (계속...)
@router.get("/devices/{device_id}/cves")
async def device_cves(device_id: int):
    """특정 디바이스의 CVE 목록"""
    mock_cves = get_recent_cves()
    return {
        "success": True,
        "data": mock_cves,
        "device_id": device_id,
        "total": len(mock_cves),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/devices/{asset_id}/components")
async def asset_components(asset_id: int, db_service: DatabaseService = Depends(get_db_service)):
    """특정 자산의 구성요소 목록 조회"""
    try:
        if USE_DATABASE and db_service.test_connection():
            components_data = db_service.get_asset_components(asset_id)
            
            # 날짜 포맷 변환
            for component in components_data:
                if component.get('created_at') and hasattr(component['created_at'], 'isoformat'):
                    component['created_at'] = component['created_at'].isoformat()
                if component.get('updated_at') and hasattr(component['updated_at'], 'isoformat'):
                    component['updated_at'] = component['updated_at'].isoformat()
            
            return {
                "success": True,
                "data": components_data,
                "asset_id": asset_id,
                "total": len(components_data),
                "timestamp": datetime.now().isoformat(),
                "source": "database"
            }
        else:
            # Mock 데이터
            mock_components = [
                {
                    "component_id": 1,
                    "asset_id": asset_id,
                    "component_type": "Software",
                    "vendor": "Apache",
                    "product": "HTTP Server",
                    "version": "2.4.41",
                    "cpe_full_string": None,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            ]
            
            return {
                "success": False,
                "data": mock_components,
                "asset_id": asset_id,
                "total": len(mock_components),
                "timestamp": datetime.now().isoformat(),
                "source": "mock_db_connection_failed"
            }
    except Exception as e:
        print(f"Error fetching asset components: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch components: {str(e)}")

@router.get("/cve/recent")
async def recent_cves():
    """최근 CVE 목록"""
    try:
        recent_data = get_recent_cves()
        return {
            "success": True,
            "data": recent_data,
            "total": len(recent_data),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cve/{cve_id}")
async def cve_detail(cve_id: str):
    """특정 CVE 상세 정보"""
    # Mock 데이터
    mock_cve = {
        "id": cve_id,
        "title": f"Vulnerability in {cve_id}",
        "description": f"Detailed description for {cve_id}",
        "cvss_score": 8.5,
        "severity": "HIGH",
        "published_date": "2025-09-01T10:00:00Z",
        "affected_products": ["Product A", "Product B"],
        "status": "analyzing"
    }
    
    return {
        "success": True,
        "data": mock_cve,
        "timestamp": datetime.now().isoformat()
    }

@router.post("/devices/{device_id}/scan")
async def scan_device(device_id: int):
    """디바이스 스캔 시작"""
    return {
        "success": True,
        "message": f"Scan initiated for device {device_id}",
        "scan_id": f"scan_{device_id}_{int(datetime.now().timestamp())}",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analysis/trends")
async def analysis_trends():
    """분석 트렌드 데이터"""
    trend_data = [
        {"date": "2025-08-01", "critical": 5, "high": 12, "medium": 25},
        {"date": "2025-08-02", "critical": 3, "high": 15, "medium": 30},
        {"date": "2025-08-03", "critical": 7, "high": 10, "medium": 20}
    ]
    
    return {
        "success": True,
        "data": trend_data,
        "timestamp": datetime.now().isoformat()
    }

def generate_cpe_string(vendor: str, product: str, version: str) -> str:
    """CPE 문자열 생성"""
    vendor_clean = re.sub(r'[^\w]', '_', vendor.lower()) if vendor else '*'
    product_clean = re.sub(r'[^\w]', '_', product.lower()) if product else '*'
    version_clean = re.sub(r'[^\w\.]', '_', version.lower()) if version else '*'
    
    return f"cpe:2.3:a:{vendor_clean}:{product_clean}:{version_clean}:*:*:*:*:*:*:*"

# CPE 매칭 관련 엔드포인트들
@router.post("/components/{component_id}/cpe-match")
async def trigger_cpe_matching(component_id: int, db_service: DatabaseService = Depends(get_db_service)):
    """CPE 자동 매칭 트리거"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # 컴포넌트 정보 조회
            component_query = """
                SELECT component_id, vendor, product, version, cpe_full_string
                FROM asset_components 
                WHERE component_id = %s
            """
            
            component_result = db_service.execute_query(component_query, (component_id,))
            
            if not component_result:
                raise HTTPException(status_code=404, detail="Component not found")
            
            component = component_result[0]
            
            # 이미 CPE가 있는지 확인
            if component.get('cpe_full_string'):
                return {
                    "success": True,
                    "message": "CPE already exists for this component",
                    "component_id": component_id,
                    "cpe_string": component['cpe_full_string'],
                    "method": "existing",
                    "timestamp": datetime.now().isoformat()
                }
            
            # CPE 자동 생성
            vendor = component.get('vendor', '')
            product = component.get('product', '')
            version = component.get('version', '')
            
            if not product:
                return {
                    "success": False,
                    "message": "Product name is required for CPE matching",
                    "component_id": component_id,
                    "needs_manual_review": True,
                    "timestamp": datetime.now().isoformat()
                }
            
            # 간단한 CPE 생성 (실제로는 더 복잡한 매칭 로직이 필요)
            cpe_string = generate_cpe_string(vendor, product, version)
            confidence_score = 0.8  # 기본 신뢰도
            
            # 데이터베이스에 CPE 업데이트
            update_query = """
                UPDATE asset_components 
                SET cpe_full_string = %s, updated_at = NOW()
                WHERE component_id = %s
            """
            db_service.execute_query(update_query, (cpe_string, component_id))
            
            # 🔥 CPE 매칭 성공 후 관련 캐시 무효화
            from app.services.cache_service import invalidate_component_cache
            invalidate_component_cache(component_id)
            
            result_data = {
                "success": True,
                "message": "CPE matching completed successfully",
                "component_id": component_id,
                "cpe_string": cpe_string,
                "method": "automatic",
                "confidence_score": confidence_score,
                "timestamp": datetime.now().isoformat(),
                "cache_invalidated": True
            }
            
            return result_data
            
        else:
            # Mock 응답
            return {
                "success": True,
                "message": "CPE matching completed (mock)",
                "component_id": component_id,
                "cpe_string": "cpe:2.3:a:mock:product:1.0:*:*:*:*:*:*:*",
                "method": "mock",
                "confidence_score": 0.9,
                "timestamp": datetime.now().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in CPE matching: {str(e)}")
        raise HTTPException(status_code=500, detail=f"CPE matching failed: {str(e)}")

@router.get("/components/{component_id}/cpe-candidates")
async def get_cpe_candidates(component_id: int, db_service: DatabaseService = Depends(get_db_service)):
    """CPE 후보 목록 조회"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # 컴포넌트 정보 조회
            component_query = """
                SELECT vendor, product, version 
                FROM asset_components 
                WHERE component_id = %s
            """
            
            component_result = db_service.execute_query(component_query, (component_id,))
            
            if not component_result:
                raise HTTPException(status_code=404, detail="Component not found")
            
            component = component_result[0]
            
            # Mock CPE 후보들 (실제로는 NVD API나 CPE 데이터베이스 검색)
            candidates = [
                {
                    "cpe_string": generate_cpe_string(
                        component.get('vendor', ''), 
                        component.get('product', ''), 
                        component.get('version', '')
                    ),
                    "confidence": 0.95,
                    "source": "exact_match"
                },
                {
                    "cpe_string": generate_cpe_string(
                        component.get('vendor', ''), 
                        component.get('product', ''), 
                        "*"
                    ),
                    "confidence": 0.8,
                    "source": "version_wildcard"
                }
            ]
            
            return {
                "success": True,
                "data": candidates,
                "component_id": component_id,
                "total": len(candidates),
                "timestamp": datetime.now().isoformat()
            }
        else:
            # Mock 데이터
            return {
                "success": False,
                "data": [],
                "component_id": component_id,
                "total": 0,
                "timestamp": datetime.now().isoformat(),
                "error": "Database connection failed"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting CPE candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get CPE candidates: {str(e)}")

@router.post("/components/{component_id}/cpe-select")
async def select_cpe_manually(component_id: int, selected_cpe: str, db_service: DatabaseService = Depends(get_db_service)):
    """수동으로 CPE 선택"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # CPE 업데이트
            update_query = """
                UPDATE asset_components 
                SET cpe_full_string = %s, updated_at = NOW()
                WHERE component_id = %s
            """
            db_service.execute_query(update_query, (selected_cpe, component_id))
            
            # 🔥 수동 CPE 선택 후 관련 캐시 무효화
            from app.services.cache_service import invalidate_component_cache
            invalidate_component_cache(component_id)
            
            return {
                "success": True,
                "message": "CPE manually assigned successfully",
                "component_id": component_id,
                "cpe_string": selected_cpe,
                "method": "manual_selection",
                "timestamp": datetime.now().isoformat(),
                "cache_invalidated": True
            }
        else:
            # Mock 응답
            return {
                "success": True,
                "message": "CPE manually assigned (mock)",
                "component_id": component_id,
                "cpe_string": selected_cpe,
                "method": "manual_mock",
                "timestamp": datetime.now().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in manual CPE selection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Manual CPE selection failed: {str(e)}")

# 🔥 캐시 관리 API 엔드포인트들
@router.get("/cache/info")
async def get_cache_status():
    """캐시 상태 정보 조회"""
    try:
        cache_info = get_cache_info()
        return {
            "success": True,
            "cache_info": cache_info,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cache info retrieval failed: {str(e)}")

@router.post("/cache/clear")
async def clear_all_cache():
    """전체 캐시 클리어"""
    try:
        cache.clear()
        return {
            "success": True,
            "message": "All cache cleared successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cache clear failed: {str(e)}")

@router.post("/cache/clear/components")
async def clear_components_cache():
    """컴포넌트 관련 캐시만 클리어"""
    try:
        # asset_components와 assets 관련 캐시 클리어
        component_count = cache.clear_pattern("asset_components")
        asset_count = cache.clear_pattern("assets")
        
        total_cleared = component_count + asset_count
        
        return {
            "success": True,
            "message": f"Component cache cleared: {total_cleared} keys removed",
            "details": {
                "component_cache_keys": component_count,
                "asset_cache_keys": asset_count,
                "total_cleared": total_cleared
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Component cache clear failed: {str(e)}")
