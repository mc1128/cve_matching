"""
CVE Dashboard API Endpoints
프론트엔드와 연동을 위한 REST API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import re
from pathlib import Path

# 데이터베이스 서비스 import
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
    from app.services.database_service import get_db_service, DatabaseService
    USE_DATABASE = True
    print("✅ Database service imported successfully")
except ImportError as e:
    USE_DATABASE = False
    print(f"⚠️ Warning: Database service not available: {e}")
except Exception as e:
    USE_DATABASE = False
    print(f"⚠️ Warning: Database service error: {e}")

router = APIRouter(prefix="/api", tags=["CVE Dashboard"])

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
        "month": base_data * 4,  # 간단한 확장
        "year": base_data * 52   # 간단한 확장
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

# API 엔드포인트들
@router.get("/dashboard/stats")
async def dashboard_stats(db_service: DatabaseService = Depends(get_db_service)):
    """대시보드 통계 API"""
    try:
        if USE_DATABASE and db_service.test_connection():
            # 실제 데이터베이스에서 통계 조회
            stats = db_service.get_dashboard_stats()
            dashboard_data = get_dashboard_stats()
            # 실제 DB 데이터로 일부 값 업데이트
            dashboard_data[0]["value"] = str(stats.get("today_new_cves", 23))
            dashboard_data[1]["value"] = str(stats.get("pending_analysis", 156))
            dashboard_data[2]["value"] = str(stats.get("critical_cves", 8))
            dashboard_data[3]["value"] = str(stats.get("total_assets", 42))
            
            return {
                "success": True,
                "data": dashboard_data,
                "total": len(dashboard_data),
                "timestamp": datetime.now().isoformat(),
                "source": "database"
            }
        else:
            # 데이터베이스 연결 실패 시 Mock 데이터 사용
            mock_data = get_dashboard_stats()
            return {
                "success": True,
                "data": mock_data,
                "total": len(mock_data),
                "timestamp": datetime.now().isoformat(),
                "source": "mock"
            }
    except Exception as e:
        # 에러 발생 시 Mock 데이터로 폴백
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

@router.get("/devices")
async def devices_list(db_service: DatabaseService = Depends(get_db_service)):
    """디바이스 목록 API - 실제 데이터베이스 연동 및 상세 오류 반환"""
    try:
        # 디버깅: 현재 DB 설정 확인
        import os
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        debug_info = {
            "db_host": db_host,
            "db_port": db_port,
            "use_database": USE_DATABASE
        }
        
        if USE_DATABASE and db_service.test_connection():
            devices_data = db_service.get_assets_with_components()
            return {
                "success": True,
                "data": devices_data,
                "total": len(devices_data),
                "timestamp": datetime.now().isoformat(),
                "source": "database",
                "debug": debug_info
            }
        else:
            # db_service.last_error가 존재하면 해당 에러를 사용
            error_message = db_service.last_error if hasattr(db_service, 'last_error') else "Database service not available or connection failed."
            mock_data = get_device_list()
            return {
                "success": False, # 성공이 아님을 명시
                "data": mock_data,
                "total": len(mock_data),
                "timestamp": datetime.now().isoformat(),
                "source": "mock_db_connection_failed",
                "error": str(error_message),
                "debug": debug_info
            }
    except Exception as e:
        mock_data = get_device_list()
        return {
            "success": False,
            "data": mock_data,
            "total": len(mock_data),
            "timestamp": datetime.now().isoformat(),
            "source": "mock_exception_fallback",
            "error": str(e)
        }

@router.get("/devices/{device_id}/cves")
async def device_cves(device_id: int):
    """특정 디바이스의 CVE 목록"""
    try:
        # 실제 구현에서는 데이터베이스에서 조회
        cves = [
            {
                "cve_id": "CVE-2025-0001",
                "severity": "CRITICAL",
                "cvss_score": 9.8,
                "status": "unpatched",
                "match_confidence": 0.95
            },
            {
                "cve_id": "CVE-2025-0002", 
                "severity": "HIGH",
                "cvss_score": 7.5,
                "status": "patch_available",
                "match_confidence": 0.88
            }
        ]
        
        return {
            "success": True,
            "device_id": device_id,
            "data": cves,
            "total": len(cves),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/devices/{asset_id}/components")
async def device_components(asset_id: int, db_service: DatabaseService = Depends(get_db_service)):
    """특정 자산의 구성요소 목록 조회"""
    try:
        if USE_DATABASE and db_service.test_connection():
            components_data = db_service.get_asset_components(asset_id)
            return {
                "success": True,
                "data": components_data,
                "total": len(components_data),
                "timestamp": datetime.now().isoformat(),
                "source": "database"
            }
        else:
            # Mock 데이터로 폴백
            mock_components = []  # 빈 리스트 또는 mock 데이터
            return {
                "success": False,
                "data": mock_components,
                "total": len(mock_components),
                "timestamp": datetime.now().isoformat(),
                "source": "mock_db_connection_failed",
                "error": db_service.last_error if hasattr(db_service, 'last_error') else "Database connection failed"
            }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "total": 0,
            "timestamp": datetime.now().isoformat(),
            "source": "mock_exception_fallback",
            "error": str(e)
        }
    """특정 자산의 구성요소 목록 API"""
    try:
        if USE_DATABASE and db_service.test_connection():
            components_data = db_service.get_asset_components(asset_id)
            return {
                "success": True,
                "data": components_data,
                "total": len(components_data),
                "timestamp": datetime.now().isoformat(),
                "source": "database"
            }
        else:
            return {
                "success": True,
                "data": [],
                "total": 0,
                "timestamp": datetime.now().isoformat(),
                "source": "mock"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cve/recent")
async def recent_cves(limit: int = 10):
    """최근 CVE 목록 API"""
    try:
        cves = get_recent_cves()[:limit]
        return {
            "success": True,
            "data": cves,
            "total": len(cves),
            "limit": limit,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cve/{cve_id}")
async def cve_detail(cve_id: str):
    """CVE 상세 정보 API"""
    try:
        # 실제 구현에서는 데이터베이스 또는 NVD API에서 조회
        cve_data = {
            "id": cve_id,
            "title": "Critical Buffer Overflow in OpenSSL",
            "description": "A critical buffer overflow vulnerability allows remote code execution",
            "cvss_score": 9.8,
            "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
            "severity": "CRITICAL",
            "published_date": "2025-09-01T14:30:00Z",
            "modified_date": "2025-09-01T16:45:00Z",
            "affected_products": ["OpenSSL 3.x", "Apache 2.4"],
            "references": [
                "https://nvd.nist.gov/vuln/detail/" + cve_id,
                "https://www.openssl.org/news/secadv/20250901.txt"
            ],
            "ai_analysis": {
                "risk_level": "extremely_high",
                "exploit_likelihood": "high",
                "patch_priority": "immediate",
                "business_impact": "critical",
                "recommended_actions": [
                    "Apply security patch immediately",
                    "Monitor for exploitation attempts",
                    "Consider temporary service isolation"
                ]
            }
        }
        
        return {
            "success": True,
            "data": cve_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/devices/{device_id}/scan")
async def trigger_device_scan(device_id: int):
    """디바이스 스캔 트리거 API"""
    try:
        # 실제 구현에서는 비동기 스캔 작업 시작
        return {
            "success": True,
            "message": f"Scan initiated for device {device_id}",
            "scan_id": f"scan_{device_id}_{int(datetime.now().timestamp())}",
            "estimated_completion": (datetime.now() + timedelta(minutes=5)).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/trends")
async def analysis_trends(days: int = 30):
    """취약점 트렌드 분석 API"""
    try:
        trend_data = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            trend_data.append({
                "date": date,
                "new_cves": 5 + (i % 10),
                "critical": 1 + (i % 3),
                "high": 3 + (i % 5),
                "medium": 8 + (i % 7),
                "low": 12 + (i % 8)
            })
        
        return {
            "success": True,
            "data": trend_data,
            "period_days": days,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_cpe_string(vendor: str, product: str, version: str) -> str:
    """
    Vendor, Product, Version 정보를 기반으로 CPE 문자열 생성
    """
    # CPE 2.3 형식으로 생성
    # cpe:2.3:a:vendor:product:version:*:*:*:*:*:*:*
    
    def normalize_cpe_component(component: str) -> str:
        """CPE 컴포넌트 정규화"""
        if not component:
            return "*"
        # 소문자 변환, 공백 제거, 특수문자 처리
        normalized = component.lower().strip()
        normalized = re.sub(r'[^a-zA-Z0-9._-]', '_', normalized)
        return normalized
    
    vendor_norm = normalize_cpe_component(vendor) if vendor else "*"
    product_norm = normalize_cpe_component(product)
    version_norm = normalize_cpe_component(version) if version else "*"
    
    return f"cpe:2.3:a:{vendor_norm}:{product_norm}:{version_norm}:*:*:*:*:*:*:*"

@router.post("/components/{component_id}/cpe-match")
async def trigger_cpe_matching(component_id: int, db_service: DatabaseService = Depends(get_db_service)):
    """
    컴포넌트에 대한 향상된 CPE 매칭 수행 (NVD + AI)
    """
    try:
        if USE_DATABASE:
            # 컴포넌트 정보 조회
            query = """
                SELECT component_id, vendor, product, version, cpe_full_string 
                FROM asset_components 
                WHERE component_id = %s
            """
            result = db_service.execute_query(query, (component_id,))
            
            if not result:
                raise HTTPException(status_code=404, detail="Component not found")
            
            component = result[0]
            
            # 이미 CPE가 있는 경우
            if component[4]:  # cpe_full_string
                return {
                    "success": True,
                    "message": "CPE already exists for this component",
                    "cpe_string": component[4],
                    "component_id": component_id,
                    "timestamp": datetime.now().isoformat(),
                    "method": "existing"
                }
            
            # 향상된 CPE 매칭 수행
            from app.services.cpe_matching_service import get_cpe_matcher
            cpe_matcher = get_cpe_matcher()
            
            matching_result = cpe_matcher.match_component_to_cpe(
                vendor=component[1],  # vendor
                product=component[2],  # product
                version=component[3]   # version
            )
            
            if matching_result["success"]:
                # 성공적으로 매칭된 경우 데이터베이스 업데이트
                cpe_string = matching_result["cpe_string"]
                
                update_query = """
                    UPDATE asset_components 
                    SET cpe_full_string = %s, updated_at = NOW()
                    WHERE component_id = %s
                """
                db_service.execute_query(update_query, (cpe_string, component_id))
                
                return {
                    "success": True,
                    "message": matching_result["message"],
                    "component_id": component_id,
                    "cpe_string": cpe_string,
                    "method": matching_result.get("method", "enhanced"),
                    "confidence_score": matching_result.get("confidence_score"),
                    "source": matching_result.get("source"),
                    "ai_reasoning": matching_result.get("ai_reasoning"),
                    "processing_time": matching_result.get("processing_time"),
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # 매칭 실패 - 수동 검토 필요
                return {
                    "success": False,
                    "message": matching_result["message"],
                    "component_id": component_id,
                    "method": matching_result.get("method", "failed"),
                    "reason": matching_result.get("reason"),
                    "candidates": matching_result.get("candidates", []),
                    "needs_manual_review": matching_result.get("needs_manual_review", True),
                    "processing_time": matching_result.get("processing_time"),
                    "timestamp": datetime.now().isoformat()
                }
        else:
            # Mock 응답 (데이터베이스 없을 경우)
            mock_cpe = f"cpe:2.3:a:example:component_{component_id}:1.0:*:*:*:*:*:*:*"
            return {
                "success": True,
                "message": "CPE matching completed (mock)",
                "component_id": component_id,
                "cpe_string": mock_cpe,
                "method": "mock",
                "timestamp": datetime.now().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in enhanced CPE matching: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced CPE matching failed: {str(e)}")

@router.get("/components/{component_id}/cpe-candidates")
async def get_cpe_candidates(component_id: int, db_service: DatabaseService = Depends(get_db_service)):
    """
    컴포넌트에 대한 CPE 후보 목록 조회 (수동 선택용)
    """
    try:
        if USE_DATABASE:
            # 컴포넌트 정보 조회
            query = """
                SELECT component_id, vendor, product, version 
                FROM asset_components 
                WHERE component_id = %s
            """
            result = db_service.execute_query(query, (component_id,))
            
            if not result:
                raise HTTPException(status_code=404, detail="Component not found")
            
            component = result[0]
            
            # CPE 후보 조회
            from app.services.cpe_matching_service import get_cpe_matcher
            cpe_matcher = get_cpe_matcher()
            
            candidates_result = cpe_matcher.get_cpe_candidates(
                vendor=component[1],  # vendor
                product=component[2],  # product
                version=component[3]   # version
            )
            
            return {
                "success": candidates_result["success"],
                "message": candidates_result["message"],
                "component_id": component_id,
                "component_info": {
                    "vendor": component[1],
                    "product": component[2],
                    "version": component[3]
                },
                "candidates": candidates_result.get("candidates", []),
                "total_results": candidates_result.get("total_results", 0),
                "timestamp": datetime.now().isoformat()
            }
        else:
            # Mock 응답
            return {
                "success": True,
                "message": "CPE candidates retrieved (mock)",
                "component_id": component_id,
                "candidates": [
                    {
                        "cpe_name": f"cpe:2.3:a:example:product_{component_id}:1.0:*:*:*:*:*:*:*",
                        "title": f"Example Product {component_id}",
                        "vendor": "example",
                        "product": f"product_{component_id}",
                        "version": "1.0",
                        "match_score": 0.9,
                        "deprecated": False
                    }
                ],
                "total_results": 1,
                "timestamp": datetime.now().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting CPE candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get CPE candidates: {str(e)}")

@router.post("/components/{component_id}/cpe-select")
async def select_cpe_manually(component_id: int, selected_cpe: str, db_service: DatabaseService = Depends(get_db_service)):
    """
    수동으로 선택된 CPE를 컴포넌트에 할당
    """
    try:
        if USE_DATABASE:
            # 컴포넌트 존재 확인
            query = """
                SELECT component_id FROM asset_components 
                WHERE component_id = %s
            """
            result = db_service.execute_query(query, (component_id,))
            
            if not result:
                raise HTTPException(status_code=404, detail="Component not found")
            
            # CPE 문자열 유효성 검사
            if not selected_cpe.startswith("cpe:2.3:"):
                raise HTTPException(status_code=400, detail="Invalid CPE format")
            
            # 데이터베이스 업데이트
            update_query = """
                UPDATE asset_components 
                SET cpe_full_string = %s, updated_at = NOW()
                WHERE component_id = %s
            """
            db_service.execute_query(update_query, (selected_cpe, component_id))
            
            return {
                "success": True,
                "message": "CPE manually assigned successfully",
                "component_id": component_id,
                "cpe_string": selected_cpe,
                "method": "manual_selection",
                "timestamp": datetime.now().isoformat()
            }
        else:
            # Mock 응답
            return {
                "success": True,
                "message": "CPE manually assigned (mock)",
                "component_id": component_id,
                "cpe_string": selected_cpe,
                "method": "manual_selection_mock",
                "timestamp": datetime.now().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in manual CPE selection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Manual CPE selection failed: {str(e)}")