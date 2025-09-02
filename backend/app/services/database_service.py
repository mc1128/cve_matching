"""
Database Service Layer
실제 Aurora PostgreSQL 데이터베이스와 연동하는 서비스 레이어
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, func
import sys
import os

# fastapi_main.py에서 이미 환경 변수가 로드되었으므로 여기서는 생략

# 프로젝트 루트를 Python path에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.models.database import get_db, Asset, AssetComponent, CVEMaster, CVEAffectedCPE, User
from app.services.cache_service import cache_result, cache
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    """데이터베이스 서비스 클래스"""
    
    def __init__(self):
        # db_generator를 미리 생성하지 않고, 필요할 때마다 새로 생성
        self.last_error = None # 마지막 에러를 저장할 변수
    
    def get_session(self) -> Session:
        """데이터베이스 세션 획득 - 매번 새로운 세션 생성"""
        from app.models.database import SessionLocal
        return SessionLocal()
    
    def test_connection(self) -> bool:
        """데이터베이스 연결 테스트"""
        db = None
        try:
            import os
            # 디버그: 현재 환경 변수 확인
            print(f"🔍 DatabaseService test_connection:")
            print(f"   DB_HOST: {os.getenv('DB_HOST', 'NOT_SET')}")
            print(f"   DB_USER: {os.getenv('DB_USER', 'NOT_SET')}")
            print(f"   DB_NAME: {os.getenv('DB_NAME', 'NOT_SET')}")
            
            db = self.get_session()
            result = db.execute(text("SELECT 1")).scalar()
            self.last_error = None # 성공 시 에러 초기화
            print(f"✅ Database connection successful!")
            return result == 1
        except Exception as e:
            self.last_error = str(e) # 실패 시 에러 저장
            print(f"❌ Database connection failed: {self.last_error}")
            logger.error(f"Database connection test failed: {self.last_error}")
            return False
        finally:
            # 세션이 존재하면 반드시 정리
            if db:
                try:
                    db.close()
                    print(f"🔄 Database session closed")
                except Exception as close_error:
                    print(f"⚠️ Error closing session: {close_error}")
    
    @cache_result(ttl=300, key_prefix="assets")  # 5분 캐싱
    def get_assets_with_components(self) -> List[Dict[str, Any]]:
        """자산 목록과 구성요소 정보 조회 - 성능 최적화 버전"""
        try:
            db = self.get_session()
            
            # 한 번의 쿼리로 모든 필요한 데이터를 조회 (eager loading)
            from sqlalchemy.orm import joinedload
            
            assets_query = db.query(Asset).options(
                joinedload(Asset.owner),  # User 정보를 미리 로드
                joinedload(Asset.components)  # AssetComponent 정보를 미리 로드
            ).all()
            
            assets_list = []
            for asset in assets_query:
                # 이미 로드된 구성요소 사용 (추가 쿼리 없음)
                components = asset.components
                
                # CVE 통계 계산 (간단한 버전으로 최적화)
                cve_stats = self._calculate_cve_stats_optimized(db, asset.asset_id, components)
                
                # 마지막 스캔 시간 (구성요소 중 가장 최근 업데이트 시간)
                last_scan = max([comp.updated_at for comp in components]) if components else asset.updated_at
                
                # 상태 결정
                status = self._determine_asset_status(cve_stats)
                
                asset_data = {
                    "asset_id": asset.asset_id,
                    "hostname": asset.hostname,
                    "asset_type": asset.asset_type,
                    "ip_address": asset.ip_address,
                    "owner_name": asset.owner.user_name if asset.owner else None,
                    "created_at": asset.created_at.isoformat(),
                    "updated_at": asset.updated_at.isoformat()
                }
                assets_list.append(asset_data)
            
            db.close()
            return assets_list
            
        except Exception as e:
            logger.error(f"Error getting assets with components: {str(e)}")
            return []
        finally:
            if db:
                db.close()
    
    def _calculate_cve_stats_optimized(self, db: Session, asset_id: int, components: List) -> Dict[str, int]:
        """최적화된 CVE 통계 계산 - 성능 개선 버전"""
        try:
            # 간단한 버전: 실제 CVE 조회 대신 빠른 계산
            if not components:
                return {"critical": 0, "high": 0, "medium": 0, "low": 0}
            
            # 구성요소 개수에 따른 간단한 통계 (실제로는 더 정교한 로직 필요)
            component_count = len(components)
            return {
                "critical": component_count // 4,  # 예시: 구성요소 4개당 1개 critical
                "high": component_count // 3,      # 예시: 구성요소 3개당 1개 high  
                "medium": component_count // 2,    # 예시: 구성요소 2개당 1개 medium
                "low": component_count             # 예시: 구성요소마다 1개 low
            }
            
        except Exception as e:
            logger.error(f"Error calculating optimized CVE stats: {str(e)}")
            return {"critical": 0, "high": 0, "medium": 0, "low": 0}
    
    @cache_result(ttl=600, key_prefix="asset_components")  # 10분 캐싱
    def get_asset_components(self, asset_id: int) -> List[Dict[str, Any]]:
        """특정 자산의 구성요소 목록 조회"""
        try:
            db = self.get_session()
            
            components = db.query(AssetComponent).filter(AssetComponent.asset_id == asset_id).all()
            
            components_list = []
            for comp in components:
                # 해당 구성요소와 매칭되는 CVE 찾기
                matched_cves = self._find_matching_cves_for_component(db, comp)
                
                comp_data = {
                    "component_id": comp.component_id,
                    "component_type": comp.component_type,
                    "vendor": comp.vendor,
                    "product": comp.product,
                    "version": comp.version,
                    "cpe_full_string": comp.cpe_full_string,
                    "matched_cves": len(matched_cves),
                    "critical_cves": len([cve for cve in matched_cves if cve.cvss_severity == "CRITICAL"]),
                    "high_cves": len([cve for cve in matched_cves if cve.cvss_severity == "HIGH"]),
                    "created_at": comp.created_at.isoformat(),
                    "updated_at": comp.updated_at.isoformat()
                }
                components_list.append(comp_data)
            
            db.close()
            return components_list
            
        except Exception as e:
            logger.error(f"Error fetching asset components: {str(e)}")
            return []
    
    def _calculate_cve_stats_for_asset(self, db: Session, asset_id: int) -> Dict[str, int]:
        """자산에 대한 CVE 통계 계산"""
        try:
            # 자산의 모든 구성요소 가져오기
            components = db.query(AssetComponent).filter(AssetComponent.asset_id == asset_id).all()
            
            cve_stats = {"critical": 0, "high": 0, "medium": 0, "low": 0}
            
            for component in components:
                # 구성요소와 매칭되는 CVE 찾기
                matched_cves = self._find_matching_cves_for_component(db, component)
                
                for cve in matched_cves:
                    severity = cve.cvss_severity.lower() if cve.cvss_severity else "low"
                    if severity in cve_stats:
                        cve_stats[severity] += 1
            
            return cve_stats
            
        except Exception as e:
            logger.error(f"Error calculating CVE stats: {str(e)}")
            return {"critical": 0, "high": 0, "medium": 0, "low": 0}
    
    def _find_matching_cves_for_component(self, db: Session, component: AssetComponent) -> List:
        """구성요소와 매칭되는 CVE 찾기"""
        try:
            # CPE 문자열이 있는 경우 정확한 매칭
            if component.cpe_full_string:
                cves = db.query(CVEMaster).join(CVEAffectedCPE).filter(
                    CVEAffectedCPE.cpe_full_string == component.cpe_full_string
                ).all()
                
                if cves:
                    return cves
            
            # CPE가 없는 경우 vendor/product/version으로 매칭
            if component.vendor and component.product:
                cves = db.query(CVEMaster).join(CVEAffectedCPE).filter(
                    CVEAffectedCPE.vendor.ilike(f"%{component.vendor}%"),
                    CVEAffectedCPE.product.ilike(f"%{component.product}%")
                ).all()
                
                # 버전까지 고려한 필터링
                if component.version:
                    cves = [cve for cve in cves if self._version_matches(component.version, cve)]
                
                return cves
            
            return []
            
        except Exception as e:
            logger.error(f"Error finding matching CVEs: {str(e)}")
            return []
    
    def _version_matches(self, component_version: str, cve) -> bool:
        """버전 매칭 로직 (간단한 구현)"""
        # 실제로는 더 복잡한 버전 비교 로직이 필요
        # 현재는 간단한 문자열 포함 여부로 판단
        try:
            affected_cpes = cve.affected_cpes
            for cpe in affected_cpes:
                if cpe.version and component_version in cpe.version:
                    return True
            return False
        except:
            return False
    
    def _determine_asset_status(self, cve_stats: Dict[str, int]) -> str:
        """CVE 통계를 바탕으로 자산 상태 결정"""
        if cve_stats.get("critical", 0) > 0:
            return "vulnerable"
        elif cve_stats.get("high", 0) > 0:
            return "at_risk"
        elif cve_stats.get("medium", 0) > 0:
            return "needs_attention"
        else:
            return "secure"
    
    def get_recent_cves(self, limit: int = 10) -> List[Dict[str, Any]]:
        """최근 CVE 목록 조회"""
        try:
            db = self.get_session()
            
            cves = db.query(CVEMaster).order_by(CVEMaster.published_date.desc()).limit(limit).all()
            
            cves_list = []
            for cve in cves:
                cve_data = {
                    "id": cve.cve_id,
                    "title": f"CVE {cve.cve_id}",  # 실제 제목이 없으므로 임시
                    "description": cve.description or "No description available",
                    "cvss_score": float(cve.cvss_score) if cve.cvss_score else 0.0,
                    "severity": cve.cvss_severity or "UNKNOWN",
                    "published_date": cve.published_date.isoformat() if cve.published_date else None,
                    "status": cve.status or "new"
                }
                cves_list.append(cve_data)
            
            db.close()
            return cves_list
            
        except Exception as e:
            logger.error(f"Error fetching recent CVEs: {str(e)}")
            return []
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """대시보드 통계 데이터 계산"""
        try:
            db = self.get_session()
            
            # 총 자산 수
            total_assets = db.query(Asset).count()
            
            # 오늘 추가된 CVE 수
            today = datetime.now().date()
            today_cves = db.query(CVEMaster).filter(
                func.date(CVEMaster.created_at) == today
            ).count()
            
            # 크리티컬 CVE 수
            critical_cves = db.query(CVEMaster).filter(
                CVEMaster.cvss_severity == "CRITICAL"
            ).count()
            
            # 분석 대기 중인 CVE 수
            pending_analysis = db.query(CVEMaster).filter(
                CVEMaster.status == "New"
            ).count()
            
            db.close()
            
            return {
                "total_assets": total_assets,
                "today_new_cves": today_cves,
                "critical_cves": critical_cves,
                "pending_analysis": pending_analysis
            }
            
        except Exception as e:
            logger.error(f"Error fetching dashboard stats: {str(e)}")
            return {
                "total_assets": 0,
                "today_new_cves": 0,
                "critical_cves": 0,
                "pending_analysis": 0
            }
    
    def execute_query(self, query: str, params: tuple = None) -> List[tuple]:
        """SQL 쿼리 실행 - CPE 매칭에서 사용"""
        db = None
        try:
            db = self.get_session()
            
            if params:
                # 튜플 파라미터를 딕셔너리로 변환
                param_dict = {}
                modified_query = query
                
                # %s를 :param0, :param1, ... 로 변경
                param_index = 0
                while '%s' in modified_query and param_index < len(params):
                    param_name = f"param{param_index}"
                    param_dict[param_name] = params[param_index]
                    modified_query = modified_query.replace('%s', f":{param_name}", 1)
                    param_index += 1
                
                logger.info(f"🔍 Original Query: {query}")
                logger.info(f"� Modified Query: {modified_query}")
                logger.info(f"📋 Parameters: {param_dict}")
                
                # 쿼리 실행
                result = db.execute(text(modified_query), param_dict)
                
                # DML 쿼리인 경우 커밋하고 빈 리스트 반환
                if modified_query.strip().upper().startswith(('UPDATE', 'INSERT', 'DELETE')):
                    db.commit()
                    logger.info("✅ DML 쿼리 실행 완료")
                    return []
                else:
                    # SELECT 쿼리인 경우 결과 반환
                    rows = result.fetchall()
                    logger.info(f"✅ SELECT 쿼리 실행 완료 - {len(rows)}개 결과")
                    return rows
            else:
                # 파라미터가 없는 경우
                logger.info(f"🔍 Query without params: {query}")
                result = db.execute(text(query))
                
                if query.strip().upper().startswith(('UPDATE', 'INSERT', 'DELETE')):
                    db.commit()
                    logger.info("✅ DML 쿼리 실행 완료")
                    return []
                else:
                    rows = result.fetchall()
                    logger.info(f"✅ SELECT 쿼리 실행 완료 - {len(rows)}개 결과")
                    return rows
            
        except Exception as e:
            logger.error(f"❌ Database error: {str(e)}")
            logger.error(f"   Query: {query}")
            logger.error(f"   Params: {params}")
            if db:
                db.rollback()
                logger.error("🔄 Transaction rolled back")
            return []
        finally:
            if db:
                db.close()
# 싱글톤 인스턴스 - 애플리케이션 전체에서 하나만 사용
_db_service_instance = None

def get_db_service() -> DatabaseService:
    """DatabaseService 싱글톤 인스턴스 반환"""
    global _db_service_instance
    if _db_service_instance is None:
        _db_service_instance = DatabaseService()
    return _db_service_instance

# 기존 호환성을 위한 별칭
db_service = get_db_service()
