"""
Enhanced CPE Matching Service with NVD API and AI Analysis
"""

import logging
import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from .nvd_cpe_client import get_nvd_cpe_client, CPEMatchResult, CPESearchResult
from .ai_analysis_service import get_ai_service, AIAnalysisResult

logger = logging.getLogger(__name__)

class EnhancedCPEMatcher:
    """향상된 CPE 매칭 서비스"""
    
    def __init__(self):
        self.nvd_client = get_nvd_cpe_client()
        self.ai_service = get_ai_service()
        
    def match_component_to_cpe(self, vendor: str, product: str, version: Optional[str] = None) -> Dict[str, Any]:
        """컴포넌트 정보를 기반으로 최적의 CPE 매칭 수행"""
        
        start_time = time.time()
        
        try:
            logger.info(f"🔍 CPE 매칭 시작")
            logger.info(f"   - Vendor: {vendor}")
            logger.info(f"   - Product: {product}")
            logger.info(f"   - Version: {version}")
            
            # 1단계: NVD에서 CPE 검색
            logger.info("📡 1단계: NVD CPE 검색 시작...")
            nvd_result = self.nvd_client.find_best_cpe_match(vendor, product, version)
            
            logger.info(f"📊 NVD 검색 결과:")
            logger.info(f"   - 성공: {nvd_result.success}")
            logger.info(f"   - 메시지: {nvd_result.message}")
            logger.info(f"   - 총 결과: {nvd_result.total_results}")
            logger.info(f"   - 신뢰도: {nvd_result.confidence_score}")
            
            if not nvd_result.success:
                logger.warning("❌ NVD 검색 실패")
                return {
                    "success": False,
                    "message": nvd_result.message,
                    "error": "NVD search failed",
                    "processing_time": time.time() - start_time,
                    "debug_info": {
                        "vendor": vendor,
                        "product": product,
                        "version": version
                    }
                }
            
            # 2단계: 신뢰도에 따른 처리 분기
            logger.info(f"🎯 2단계: 신뢰도 분석 (점수: {nvd_result.confidence_score})")
            
            if nvd_result.confidence_score >= 0.8:
                # 높은 신뢰도: 자동 매칭
                logger.info("✅ 높은 신뢰도 - 자동 매칭 수행")
                return {
                    "success": True,
                    "message": "High confidence automatic match",
                    "method": "automatic",
                    "cpe_string": nvd_result.recommended_cpe,
                    "confidence_score": nvd_result.confidence_score,
                    "total_candidates": nvd_result.total_results,
                    "processing_time": time.time() - start_time,
                    "source": "nvd_direct"
                }
            
            elif nvd_result.confidence_score >= 0.5:
                # 중간 신뢰도: AI 분석
                logger.info("🤖 중간 신뢰도 - AI 분석 수행")
                
                ai_result = self.ai_service.analyze_cpe_matches(
                    vendor, product, version, nvd_result.results
                )
                
                logger.info(f"🎭 AI 분석 결과:")
                logger.info(f"   - 성공: {ai_result.success}")
                logger.info(f"   - 추천 CPE: {ai_result.recommended_cpe}")
                logger.info(f"   - 신뢰도: {ai_result.confidence_score}")
                logger.info(f"   - 수동검토 필요: {ai_result.should_manual_review}")
                
                if ai_result.success and not ai_result.should_manual_review:
                    logger.info("✅ AI 분석 성공 - 자동 매칭")
                    return {
                        "success": True,
                        "message": "AI-assisted match",
                        "method": "ai_assisted",
                        "cpe_string": ai_result.recommended_cpe,
                        "confidence_score": ai_result.confidence_score,
                        "ai_reasoning": ai_result.reasoning,
                        "total_candidates": nvd_result.total_results,
                        "processing_time": time.time() - start_time,
                        "source": "ai_analysis"
                    }
                else:
                    # AI도 확신하지 못함 - 수동 검토 필요
                    logger.warning("🤔 AI 분석 불확실 - 수동 검토 필요")
                    return {
                        "success": False,
                        "message": "Manual review required",
                        "method": "manual_review",
                        "reason": ai_result.reasoning if ai_result.reasoning else "AI analysis inconclusive",
                        "candidates": [
                            {
                                "cpe_name": cpe.cpe_name,
                                "title": cpe.title,
                                "vendor": cpe.vendor,
                                "product": cpe.product,
                                "version": cpe.version,
                                "match_score": cpe.match_score,
                                "deprecated": cpe.deprecated
                            }
                            for cpe in nvd_result.results[:5]
                        ],
                        "total_candidates": nvd_result.total_results,
                        "processing_time": time.time() - start_time,
                        "needs_manual_review": True
                    }
            
            else:
                # 낮은 신뢰도: 수동 검토 필요
                logger.warning(f"⚠️ 낮은 신뢰도 - 수동 검토 필요 (점수: {nvd_result.confidence_score})")
                return {
                    "success": False,
                    "message": "Low confidence - manual review required",
                    "method": "manual_review",
                    "reason": f"Low confidence score: {nvd_result.confidence_score:.2f}",
                    "candidates": [
                        {
                            "cpe_name": cpe.cpe_name,
                            "title": cpe.title,
                            "vendor": cpe.vendor,
                            "product": cpe.product,
                            "version": cpe.version,
                            "match_score": cpe.match_score,
                            "deprecated": cpe.deprecated
                        }
                        for cpe in nvd_result.results[:5]
                    ],
                    "total_candidates": nvd_result.total_results,
                    "processing_time": time.time() - start_time,
                    "needs_manual_review": True
                }
                
        except Exception as e:
            logger.error(f"❌ CPE 매칭 중 오류: {str(e)}")
            import traceback
            logger.error(f"상세 오류:\n{traceback.format_exc()}")
            return {
                "success": False,
                "message": f"CPE matching error: {str(e)}",
                "error": str(e),
                "processing_time": time.time() - start_time,
                "debug_info": {
                    "vendor": vendor,
                    "product": product,
                    "version": version
                }
            }
    
    def get_cpe_candidates(self, vendor: str, product: str, version: Optional[str] = None) -> Dict[str, Any]:
        """CPE 후보 목록만 조회 (수동 선택용)"""
        try:
            nvd_result = self.nvd_client.find_best_cpe_match(vendor, product, version)
            
            if not nvd_result.success:
                return {
                    "success": False,
                    "message": nvd_result.message,
                    "candidates": []
                }
            
            candidates = [
                {
                    "cpe_name": cpe.cpe_name,
                    "title": cpe.title,
                    "vendor": cpe.vendor,
                    "product": cpe.product,
                    "version": cpe.version,
                    "match_score": cpe.match_score,
                    "deprecated": cpe.deprecated,
                    "last_modified": cpe.last_modified
                }
                for cpe in nvd_result.results
            ]
            
            return {
                "success": True,
                "message": f"Found {len(candidates)} CPE candidates",
                "candidates": candidates,
                "total_results": nvd_result.total_results
            }
            
        except Exception as e:
            logger.error(f"CPE 후보 조회 중 오류: {str(e)}")
            return {
                "success": False,
                "message": f"Error fetching CPE candidates: {str(e)}",
                "candidates": []
            }

# 기존 호환성을 위한 함수들
def generate_cpe_string(vendor: str, product: str, version: str) -> str:
    """
    Vendor, Product, Version 정보를 기반으로 CPE 문자열 생성
    (기존 호환성 유지)
    """
    def normalize_cpe_component(component: str) -> str:
        """CPE 컴포넌트 정규화"""
        if not component:
            return "*"
        # 소문자 변환, 공백 제거, 특수문자 처리
        import re
        normalized = component.lower().strip()
        normalized = re.sub(r'[^a-zA-Z0-9._-]', '_', normalized)
        return normalized
    
    vendor_norm = normalize_cpe_component(vendor) if vendor else "*"
    product_norm = normalize_cpe_component(product)
    version_norm = normalize_cpe_component(version) if version else "*"
    
    return f"cpe:2.3:a:{vendor_norm}:{product_norm}:{version_norm}:*:*:*:*:*:*:*"

def match_cpe_with_nvd(vendor: str, product: str, version: str = None) -> Dict[str, Any]:
    """
    NVD를 사용한 CPE 매칭 (기존 호환성 유지)
    """
    matcher = EnhancedCPEMatcher()
    return matcher.match_component_to_cpe(vendor, product, version)

# 싱글톤 인스턴스
_cpe_matcher_instance = None

def get_cpe_matcher() -> EnhancedCPEMatcher:
    """CPE 매처 싱글톤 인스턴스 반환"""
    global _cpe_matcher_instance
    if _cpe_matcher_instance is None:
        _cpe_matcher_instance = EnhancedCPEMatcher()
    return _cpe_matcher_instance
