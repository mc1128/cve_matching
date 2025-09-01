"""
CVE Matching System 데이터베이스 관리 클래스
Aurora PostgreSQL + CVE 스키마 최적화
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

# 환경 변수 로드
load_dotenv('.env.local')

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVEDatabaseManager:
    """CVE 매칭 시스템 전용 데이터베이스 관리자"""
    
    def __init__(self):
        self.config = {
            'host': os.getenv('RDS_HOST'),
            'user': os.getenv('RDS_USER'),
            'password': os.getenv('RDS_PASSWORD'),
            'database': os.getenv('RDS_DATABASE'),
            'port': int(os.getenv('RDS_PORT', 5432)),
            'sslmode': 'require'
        }
        self.connection = None
    
    def connect(self) -> psycopg2.extensions.connection:
        """데이터베이스 연결"""
        try:
            self.connection = psycopg2.connect(**self.config)
            return self.connection
        except Exception as e:
            logger.error(f"❌ 데이터베이스 연결 실패: {e}")
            raise
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """쿼리 실행 (SELECT)"""
        try:
            with self.connect() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    result = cursor.fetchall()
                    return [dict(row) for row in result]
        except Exception as e:
            logger.error(f"❌ 쿼리 실행 실패: {e}")
            raise
    
    def execute_command(self, command: str, params: tuple = None) -> int:
        """명령 실행 (INSERT, UPDATE, DELETE)"""
        try:
            with self.connect() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(command, params)
                    conn.commit()
                    return cursor.rowcount
        except Exception as e:
            logger.error(f"❌ 명령 실행 실패: {e}")
            raise

# =============================================================================
# 사용자 관리
# =============================================================================
class UserManager(CVEDatabaseManager):
    """사용자 관리 클래스"""
    
    def create_user(self, user_name: str, email: str, department: str = None) -> int:
        """새 사용자 생성"""
        query = """
            INSERT INTO users (user_name, email, department)
            VALUES (%s, %s, %s)
            RETURNING user_id
        """
        result = self.execute_query(query, (user_name, email, department))
        return result[0]['user_id'] if result else None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """이메일로 사용자 조회"""
        query = "SELECT * FROM users WHERE email = %s"
        result = self.execute_query(query, (email,))
        return result[0] if result else None
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """모든 사용자 조회"""
        query = "SELECT * FROM users ORDER BY user_name"
        return self.execute_query(query)

# =============================================================================
# 자산 관리
# =============================================================================
class AssetManager(CVEDatabaseManager):
    """자산 관리 클래스"""
    
    def create_asset(self, hostname: str, ip_address: str, asset_type: str, owner_user_id: int = None) -> int:
        """새 자산 생성"""
        query = """
            INSERT INTO assets (hostname, ip_address, asset_type, owner_user_id)
            VALUES (%s, %s, %s, %s)
            RETURNING asset_id
        """
        result = self.execute_query(query, (hostname, ip_address, asset_type, owner_user_id))
        return result[0]['asset_id'] if result else None
    
    def get_asset_by_hostname(self, hostname: str) -> Optional[Dict[str, Any]]:
        """호스트명으로 자산 조회"""
        query = """
            SELECT a.*, u.user_name as owner_name 
            FROM assets a 
            LEFT JOIN users u ON a.owner_user_id = u.user_id 
            WHERE a.hostname = %s
        """
        result = self.execute_query(query, (hostname,))
        return result[0] if result else None
    
    def get_all_assets(self) -> List[Dict[str, Any]]:
        """모든 자산 조회"""
        query = """
            SELECT a.*, u.user_name as owner_name 
            FROM assets a 
            LEFT JOIN users u ON a.owner_user_id = u.user_id 
            ORDER BY a.hostname
        """
        return self.execute_query(query)
    
    def add_component_to_asset(self, asset_id: int, component_type: str, vendor: str, 
                              product: str, version: str, cpe_full_string: str = None) -> int:
        """자산에 구성요소 추가"""
        query = """
            INSERT INTO asset_components (asset_id, component_type, vendor, product, version, cpe_full_string)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING component_id
        """
        result = self.execute_query(query, (asset_id, component_type, vendor, product, version, cpe_full_string))
        return result[0]['component_id'] if result else None
    
    def get_asset_components(self, asset_id: int) -> List[Dict[str, Any]]:
        """자산의 구성요소 조회"""
        query = """
            SELECT * FROM asset_components 
            WHERE asset_id = %s 
            ORDER BY component_type, vendor, product
        """
        return self.execute_query(query, (asset_id,))

# =============================================================================
# CVE 관리
# =============================================================================
class CVEManager(CVEDatabaseManager):
    """CVE 취약점 관리 클래스"""
    
    def create_cve(self, cve_id: str, cvss_score: float = None, description: str = None,
                   cvss_severity: str = None, published_date: str = None, 
                   weakness_type_cwe: str = None) -> str:
        """새 CVE 생성"""
        query = """
            INSERT INTO cve_master (cve_id, cvss_score, description, cvss_severity, published_date, weakness_type_cwe)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (cve_id) DO UPDATE SET
                cvss_score = EXCLUDED.cvss_score,
                description = EXCLUDED.description,
                cvss_severity = EXCLUDED.cvss_severity,
                published_date = EXCLUDED.published_date,
                weakness_type_cwe = EXCLUDED.weakness_type_cwe,
                updated_at = NOW()
            RETURNING cve_id
        """
        result = self.execute_query(query, (cve_id, cvss_score, description, cvss_severity, published_date, weakness_type_cwe))
        return result[0]['cve_id'] if result else None
    
    def get_cve_by_id(self, cve_id: str) -> Optional[Dict[str, Any]]:
        """CVE ID로 취약점 조회"""
        query = "SELECT * FROM cve_master WHERE cve_id = %s"
        result = self.execute_query(query, (cve_id,))
        return result[0] if result else None
    
    def get_cves_by_severity(self, severity: str, limit: int = 50) -> List[Dict[str, Any]]:
        """심각도별 CVE 조회"""
        query = """
            SELECT cve_id, cvss_score, description, cvss_severity, status,
                   ai_analysis_status, ai_analysis_requested_at, ai_analysis_completed_at,
                   published_date, weakness_type_cwe
            FROM cve_master 
            WHERE cvss_severity = %s 
            ORDER BY cvss_score DESC, published_date DESC 
            LIMIT %s
        """
        return self.execute_query(query, (severity, limit))
    
    def request_ai_analysis(self, cve_id: str) -> Optional[Dict[str, Any]]:
        """CVE에 대한 AI 분석 요청"""
        query = """
            UPDATE cve_master 
            SET ai_analysis_requested_at = NOW(),
                ai_analysis_status = 'pending'
            WHERE cve_id = %s
            RETURNING cve_id, ai_analysis_requested_at, ai_analysis_status
        """
        result = self.execute_query(query, (cve_id,))
        return result[0] if result else None
    
    def update_ai_analysis_status(self, cve_id: str, status: str) -> Optional[Dict[str, Any]]:
        """AI 분석 상태 업데이트"""
        valid_statuses = ['pending', 'processing', 'completed', 'failed', 'skipped']
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
        
        query = """
            UPDATE cve_master 
            SET ai_analysis_status = %s
            WHERE cve_id = %s
            RETURNING cve_id, ai_analysis_status, ai_analysis_completed_at
        """
        result = self.execute_query(query, (status, cve_id))
        return result[0] if result else None
    
    def save_ai_analysis_report(self, cve_id: str, report_data: dict) -> Optional[Dict[str, Any]]:
        """AI 분석 리포트 저장"""
        import json
        query = """
            UPDATE cve_master 
            SET ai_analysis_report = %s,
                ai_analysis_status = 'completed'
            WHERE cve_id = %s
            RETURNING cve_id, ai_analysis_status, ai_analysis_completed_at
        """
        result = self.execute_query(query, (json.dumps(report_data), cve_id))
        return result[0] if result else None
    
    def get_ai_analysis_report(self, cve_id: str) -> Optional[Dict[str, Any]]:
        """CVE의 AI 분석 리포트 조회"""
        query = """
            SELECT cve_id, ai_analysis_report, ai_analysis_status,
                   ai_analysis_requested_at, ai_analysis_completed_at,
                   cvss_score, cvss_severity, description
            FROM cve_master 
            WHERE cve_id = %s
        """
        result = self.execute_query(query, (cve_id,))
        return result[0] if result else None
    
    def get_pending_ai_analysis(self, limit: int = 10) -> List[Dict[str, Any]]:
        """AI 분석 대기 중인 CVE 목록"""
        query = """
            SELECT cve_id, cvss_score, cvss_severity, ai_analysis_requested_at,
                   NOW() - ai_analysis_requested_at as waiting_time
            FROM cve_master 
            WHERE ai_analysis_status = 'pending'
            ORDER BY ai_analysis_requested_at ASC
            LIMIT %s
        """
        return self.execute_query(query, (limit,))
    
    def get_ai_analysis_stats(self) -> List[Dict[str, Any]]:
        """AI 분석 통계 조회"""
        return self.execute_query("SELECT * FROM ai_analysis_stats")
    
    def get_ai_analysis_queue(self) -> List[Dict[str, Any]]:
        """AI 분석 대기열 조회"""
        return self.execute_query("SELECT * FROM ai_analysis_queue")
    
    def add_affected_cpe(self, cve_id: str, cpe_full_string: str, vendor: str, product: str, version: str) -> int:
        """CVE 영향 대상 CPE 추가"""
        query = """
            INSERT INTO cve_affected_cpes (cve_id, cpe_full_string, vendor, product, version)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """
        result = self.execute_query(query, (cve_id, cpe_full_string, vendor, product, version))
        return result[0]['id'] if result else None
    
    def add_cve_reference(self, cve_id: str, url: str) -> int:
        """CVE 참고자료 추가"""
        query = """
            INSERT INTO cve_references (cve_id, url)
            VALUES (%s, %s)
            RETURNING id
        """
        result = self.execute_query(query, (cve_id, url))
        return result[0]['id'] if result else None

# =============================================================================
# 취약점 매칭 분석
# =============================================================================
class VulnerabilityAnalyzer(CVEDatabaseManager):
    """취약점 매칭 및 분석 클래스"""
    
    def get_asset_vulnerabilities(self, asset_id: int = None) -> List[Dict[str, Any]]:
        """자산별 취약점 매칭 결과"""
        if asset_id:
            query = "SELECT * FROM asset_vulnerabilities WHERE asset_id = %s ORDER BY cvss_score DESC"
            return self.execute_query(query, (asset_id,))
        else:
            query = "SELECT * FROM asset_vulnerabilities ORDER BY asset_id, cvss_score DESC"
            return self.execute_query(query)
    
    def get_vulnerability_statistics(self, asset_id: int = None) -> Dict[str, Any]:
        """취약점 통계"""
        if asset_id:
            query = "SELECT * FROM get_asset_vulnerability_count(%s)"
            result = self.execute_query(query, (asset_id,))
        else:
            query = """
                SELECT 
                    COUNT(*) as total_cves,
                    COUNT(CASE WHEN cm.cvss_severity = 'CRITICAL' THEN 1 END) as critical_cves,
                    COUNT(CASE WHEN cm.cvss_severity = 'HIGH' THEN 1 END) as high_cves,
                    COUNT(CASE WHEN cm.cvss_severity = 'MEDIUM' THEN 1 END) as medium_cves,
                    COUNT(CASE WHEN cm.cvss_severity = 'LOW' THEN 1 END) as low_cves
                FROM cve_master cm
            """
            result = self.execute_query(query)
        
        return result[0] if result else {}
    
    def find_matching_vulnerabilities(self, vendor: str, product: str, version: str = None) -> List[Dict[str, Any]]:
        """제품별 매칭되는 취약점 검색"""
        if version:
            query = """
                SELECT DISTINCT cm.* 
                FROM cve_master cm
                JOIN cve_affected_cpes cac ON cm.cve_id = cac.cve_id
                WHERE cac.vendor ILIKE %s AND cac.product ILIKE %s AND cac.version = %s
                ORDER BY cm.cvss_score DESC
            """
            return self.execute_query(query, (f"%{vendor}%", f"%{product}%", version))
        else:
            query = """
                SELECT DISTINCT cm.* 
                FROM cve_master cm
                JOIN cve_affected_cpes cac ON cm.cve_id = cac.cve_id
                WHERE cac.vendor ILIKE %s AND cac.product ILIKE %s
                ORDER BY cm.cvss_score DESC
            """
            return self.execute_query(query, (f"%{vendor}%", f"%{product}%"))

# =============================================================================
# 채팅 기록 관리 (기존 호환성)
# =============================================================================
class ChatManager(CVEDatabaseManager):
    """채팅 기록 관리"""
    
    def add_chat_message(self, user_id: str, prompt: str, response: str) -> int:
        """채팅 메시지 추가"""
        query = """
            INSERT INTO chat_history (user_id, prompt, response)
            VALUES (%s, %s, %s)
            RETURNING id
        """
        result = self.execute_query(query, (user_id, prompt, response))
        return result[0]['id'] if result else None
    
    def get_chat_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """채팅 기록 조회"""
        query = """
            SELECT id, prompt, response, created_at
            FROM chat_history
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """
        return self.execute_query(query, (user_id, limit))

# =============================================================================
# 통합 관리자 클래스
# =============================================================================
class CVEMatchingSystem:
    """CVE 매칭 시스템 통합 관리자"""
    
    def __init__(self):
        self.users = UserManager()
        self.assets = AssetManager()
        self.cves = CVEManager()
        self.analyzer = VulnerabilityAnalyzer()
        self.chat = ChatManager()
    
    def test_connection(self) -> Dict[str, Any]:
        """연결 테스트"""
        try:
            result = self.users.execute_query("SELECT version() as version, now() as current_time")
            return {
                'success': True,
                'version': result[0]['version'],
                'current_time': result[0]['current_time'],
                'host': os.getenv('RDS_HOST'),
                'database': os.getenv('RDS_DATABASE')
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# 전역 인스턴스
cve_system = CVEMatchingSystem()

# 편의 함수들 (기존 호환성)
def get_connection():
    return cve_system.users.connect()

def execute_query(query: str, params: tuple = None) -> List[Dict[str, Any]]:
    return cve_system.users.execute_query(query, params)

def execute_command(command: str, params: tuple = None) -> int:
    return cve_system.users.execute_command(command, params)

def test_connection() -> Dict[str, Any]:
    return cve_system.test_connection()
