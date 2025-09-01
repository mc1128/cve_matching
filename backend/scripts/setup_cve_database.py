#!/usr/bin/env python3
"""
CVE Matching System 데이터베이스 스키마 생성 및 검증 스크립트
Aurora PostgreSQL용 완전한 스키마 구축
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import execute_query, execute_command, test_connection
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_cve_schema():
    """CVE 매칭 시스템의 완전한 스키마 생성"""
    
    print("🚀 CVE Matching System 스키마 생성 시작...")
    
    # 연결 테스트
    connection_result = test_connection()
    if not connection_result['success']:
        print(f"❌ 데이터베이스 연결 실패: {connection_result['error']}")
        return False
    
    print("✅ 데이터베이스 연결 성공!")
    
    # SQL 파일 읽기
    try:
        with open('create_cve_schema.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # SQL 명령어들로 분할 (세미콜론 기준)
        sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        print(f"📝 총 {len(sql_commands)}개의 SQL 명령어를 실행합니다...")
        
        success_count = 0
        for i, command in enumerate(sql_commands, 1):
            try:
                # 주석만 있는 명령어는 건너뛰기
                if command.strip().startswith('--') or not command.strip():
                    continue
                
                execute_command(command)
                success_count += 1
                
                if i % 10 == 0:  # 10개마다 진행상황 출력
                    print(f"⏳ 진행상황: {i}/{len(sql_commands)} 완료...")
                    
            except Exception as e:
                logger.warning(f"명령어 실행 경고 (계속 진행): {str(e)[:100]}...")
                continue
        
        print(f"✅ 스키마 생성 완료! ({success_count}개 명령어 성공)")
        
    except FileNotFoundError:
        print("❌ create_cve_schema.sql 파일을 찾을 수 없습니다.")
        return False
    except Exception as e:
        print(f"❌ 스키마 생성 실패: {e}")
        return False
    
    return True

def verify_schema():
    """생성된 스키마 검증"""
    
    print("\n🔍 스키마 검증 중...")
    
    # 테이블 목록 확인
    tables_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """
    
    try:
        tables = execute_query(tables_query)
        print(f"\n📊 생성된 테이블 ({len(tables)}개):")
        for table in tables:
            print(f"  ✓ {table['table_name']}")
        
        # 각 테이블의 레코드 수 확인
        print(f"\n📈 테이블별 데이터 현황:")
        expected_tables = [
            'users', 'assets', 'cve_master', 'asset_components', 
            'cve_affected_cpes', 'cve_references', 'chat_history'
        ]
        
        for table_name in expected_tables:
            try:
                count_result = execute_query(f"SELECT COUNT(*) as count FROM {table_name}")
                count = count_result[0]['count'] if count_result else 0
                print(f"  📋 {table_name}: {count} 레코드")
            except Exception as e:
                print(f"  ❌ {table_name}: 조회 실패 ({e})")
        
        # 뷰 확인
        views_query = """
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """
        
        views = execute_query(views_query)
        if views:
            print(f"\n🔭 생성된 뷰 ({len(views)}개):")
            for view in views:
                print(f"  ✓ {view['table_name']}")
        
        # 함수 확인
        functions_query = """
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_type = 'FUNCTION'
            ORDER BY routine_name;
        """
        
        functions = execute_query(functions_query)
        if functions:
            print(f"\n⚡ 생성된 함수 ({len(functions)}개):")
            for func in functions:
                print(f"  ✓ {func['routine_name']}")
        
        return True
        
    except Exception as e:
        print(f"❌ 스키마 검증 실패: {e}")
        return False

def test_sample_queries():
    """샘플 쿼리 테스트"""
    
    print("\n🧪 샘플 쿼리 테스트...")
    
    test_queries = [
        {
            'name': '전체 자산 목록',
            'query': 'SELECT asset_id, hostname, asset_type FROM assets LIMIT 5'
        },
        {
            'name': '심각한 취약점 목록',
            'query': "SELECT cve_id, cvss_score, cvss_severity FROM cve_master WHERE cvss_severity = 'CRITICAL' LIMIT 5"
        },
        {
            'name': '자산별 취약점 매칭 뷰',
            'query': 'SELECT * FROM asset_vulnerabilities LIMIT 3'
        }
    ]
    
    for test in test_queries:
        try:
            result = execute_query(test['query'])
            print(f"  ✅ {test['name']}: {len(result)} 결과")
            
            # 첫 번째 결과만 출력
            if result:
                first_row = result[0]
                print(f"     예시: {dict(first_row)}")
                
        except Exception as e:
            print(f"  ❌ {test['name']}: 실패 ({e})")

def main():
    """메인 실행 함수"""
    
    print("=" * 60)
    print("🛡️ CVE Matching System Database Setup")
    print("=" * 60)
    
    # 1. 스키마 생성
    if not create_cve_schema():
        print("\n❌ 스키마 생성에 실패했습니다.")
        return False
    
    # 2. 스키마 검증
    if not verify_schema():
        print("\n❌ 스키마 검증에 실패했습니다.")
        return False
    
    # 3. 샘플 쿼리 테스트
    test_sample_queries()
    
    print("\n" + "=" * 60)
    print("🎉 CVE Matching System 데이터베이스 설정 완료!")
    print("=" * 60)
    
    print("\n📖 사용 가능한 테이블:")
    print("  • users: 사용자 관리")
    print("  • assets: 자산 관리") 
    print("  • cve_master: CVE 취약점 마스터")
    print("  • asset_components: 자산 구성요소")
    print("  • cve_affected_cpes: CVE 영향 대상")
    print("  • cve_references: CVE 참고자료")
    print("  • chat_history: 채팅 기록")
    
    print("\n🔍 유용한 뷰:")
    print("  • asset_vulnerabilities: 자산별 취약점 매칭")
    
    print("\n⚡ 유용한 함수:")
    print("  • get_asset_vulnerability_count(asset_id): 자산별 취약점 통계")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
