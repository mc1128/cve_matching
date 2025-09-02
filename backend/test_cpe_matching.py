#!/usr/bin/env python3
"""
CPE 매칭 시스템 테스트 스크립트
"""

import sys
import os
import asyncio
import logging

# 프로젝트 루트를 Python path에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# 환경 변수 설정
os.environ['NVD_API_KEY'] = '85a5e617-c505-4564-b1cb-3e09223e5d91'
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['AI_ANALYSIS_ENABLED'] = 'false'  # 테스트에서는 AI 비활성화

from app.services.nvd_cpe_client import get_nvd_cpe_client
from app.services.cpe_matching_service import get_cpe_matcher

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_nvd_client():
    """NVD 클라이언트 테스트"""
    print("🔍 NVD CPE 클라이언트 테스트 시작...")
    
    client = get_nvd_cpe_client()
    
    # 테스트 케이스들
    test_cases = [
        ("apache", "httpd", "2.4.41"),
        ("microsoft", "windows", "10"),
        ("mysql", "mysql", "8.0.21"),
        ("nginx", "nginx", "1.18.0"),
    ]
    
    for vendor, product, version in test_cases:
        print(f"\n--- 테스트: {vendor} {product} {version} ---")
        
        try:
            result = client.find_best_cpe_match(vendor, product, version)
            
            if result.success:
                print(f"✅ 성공: {result.message}")
                print(f"📊 총 결과: {result.total_results}개")
                print(f"🎯 신뢰도: {result.confidence_score:.2f}")
                
                if result.recommended_cpe:
                    print(f"🏆 추천 CPE: {result.recommended_cpe}")
                
                if result.results:
                    print(f"📋 상위 3개 결과:")
                    for i, cpe in enumerate(result.results[:3], 1):
                        print(f"   {i}. {cpe.cpe_name} (점수: {cpe.match_score:.2f})")
            else:
                print(f"❌ 실패: {result.message}")
                
        except Exception as e:
            print(f"❌ 오류: {str(e)}")
        
        # API 속도 제한을 위한 대기
        await asyncio.sleep(1)

async def test_cpe_matcher():
    """통합 CPE 매처 테스트"""
    print("\n\n🤖 통합 CPE 매처 테스트 시작...")
    
    matcher = get_cpe_matcher()
    
    # 테스트 케이스들
    test_cases = [
        ("apache", "httpd", "2.4.41"),
        ("oracle", "mysql", "8.0.21"),
        ("unknown", "software", "1.0.0"),  # 낮은 신뢰도 테스트
    ]
    
    for vendor, product, version in test_cases:
        print(f"\n--- 통합 테스트: {vendor} {product} {version} ---")
        
        try:
            result = matcher.match_component_to_cpe(vendor, product, version)
            
            if result["success"]:
                print(f"✅ 성공: {result['message']}")
                print(f"🔧 방법: {result.get('method', 'unknown')}")
                print(f"🏆 CPE: {result.get('cpe_string', 'N/A')}")
                
                if 'confidence_score' in result:
                    print(f"🎯 신뢰도: {result['confidence_score']:.2f}")
                
                if 'processing_time' in result:
                    print(f"⏱️ 처리 시간: {result['processing_time']:.2f}초")
                    
            else:
                print(f"❌ 실패: {result['message']}")
                
                if result.get('needs_manual_review'):
                    print(f"📋 수동 검토 필요")
                    candidates = result.get('candidates', [])
                    if candidates:
                        print(f"🔍 후보 {len(candidates)}개:")
                        for i, candidate in enumerate(candidates[:3], 1):
                            print(f"   {i}. {candidate['cpe_name']} (점수: {candidate['match_score']:.2f})")
                
        except Exception as e:
            print(f"❌ 오류: {str(e)}")
        
        # API 속도 제한을 위한 대기
        await asyncio.sleep(1)

async def main():
    """메인 테스트 함수"""
    print("🚀 CPE 매칭 시스템 테스트 시작")
    print("=" * 50)
    
    # 1. NVD 클라이언트 테스트
    await test_nvd_client()
    
    # 2. 통합 매처 테스트
    await test_cpe_matcher()
    
    print("\n" + "=" * 50)
    print("✅ 모든 테스트 완료")

if __name__ == "__main__":
    asyncio.run(main())
