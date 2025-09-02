"""
NVD CPE API Client
National Vulnerability Database의 CPE API와 연동하는 클라이언트
https://nvd.nist.gov/developers/products 참고
"""

import requests
import time
import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from urllib.parse import quote_plus
import json

logger = logging.getLogger(__name__)

@dataclass
class CPESearchResult:
    """CPE 검색 결과 데이터 클래스"""
    cpe_name: str
    cpe_name_id: str
    title: str
    last_modified: str
    deprecated: bool
    vendor: Optional[str] = None
    product: Optional[str] = None
    version: Optional[str] = None
    match_score: float = 0.0  # 매칭 점수 (0.0 - 1.0)

@dataclass
class CPEMatchResult:
    """CPE 매칭 결과"""
    success: bool
    message: str
    results: List[CPESearchResult]
    total_results: int
    confidence_score: float = 0.0  # 전체 신뢰도
    recommended_cpe: Optional[str] = None

class NVDCPEClient:
    """NVD CPE API 클라이언트"""
    
    def __init__(self):
        self.base_url = "https://services.nvd.nist.gov/rest/json"
        self.api_key = os.getenv("NVD_API_KEY")
        self.request_delay = 0.6  # API 속도 제한 (초당 1.67 요청)
        self.last_request_time = 0
        
        # API 키가 있으면 더 빠른 요청 가능
        if self.api_key:
            self.request_delay = 0.1  # API 키가 있으면 초당 10 요청
    
    def _wait_for_rate_limit(self):
        """API 속도 제한 대기"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.request_delay:
            sleep_time = self.request_delay - time_since_last
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict]:
        """NVD API 요청 수행"""
        self._wait_for_rate_limit()
        
        url = f"{self.base_url}/{endpoint}"
        headers = {
            "User-Agent": "CVE-Matching-System/1.0",
            "Accept": "application/json"
        }
        
        # API 키가 있으면 헤더에 추가
        if self.api_key:
            headers["apiKey"] = self.api_key
        
        try:
            logger.info(f"NVD API 요청: {url} with params: {params}")
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"NVD API 요청 실패: {str(e)}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {str(e)}")
            return None
    
    def search_cpe_by_keyword(self, keyword: str, results_per_page: int = 20) -> List[CPESearchResult]:
        """키워드로 CPE 검색"""
        params = {
            "keywordSearch": keyword,
            "resultsPerPage": min(results_per_page, 2000),  # NVD 최대 제한
            "startIndex": 0
        }
        
        response_data = self._make_request("cpes/2.0", params)
        if not response_data:
            return []
        
        results = []
        products = response_data.get("products", [])
        
        for product in products:
            cpe_data = product.get("cpe", {})
            
            # CPE 정보 파싱
            cpe_name = cpe_data.get("cpeName", "")
            cpe_parts = self._parse_cpe_name(cpe_name)
            
            result = CPESearchResult(
                cpe_name=cpe_name,
                cpe_name_id=cpe_data.get("cpeNameId", ""),
                title=cpe_data.get("titles", [{}])[0].get("title", ""),
                last_modified=cpe_data.get("lastModified", ""),
                deprecated=cpe_data.get("deprecated", False),
                vendor=cpe_parts.get("vendor"),
                product=cpe_parts.get("product"),
                version=cpe_parts.get("version")
            )
            
            results.append(result)
        
        return results
    
    def search_cpe_by_vendor_product(self, vendor: str, product: str, version: Optional[str] = None) -> List[CPESearchResult]:
        """Vendor와 Product로 정확한 CPE 검색"""
        # 복합 검색어 생성
        keywords = []
        if vendor:
            keywords.append(vendor)
        if product:
            keywords.append(product)
        if version:
            keywords.append(version)
        
        keyword = " ".join(keywords)
        return self.search_cpe_by_keyword(keyword)
    
    def _parse_cpe_name(self, cpe_name: str) -> Dict[str, Optional[str]]:
        """CPE 이름을 파싱하여 vendor, product, version 추출"""
        # CPE 2.3 형식: cpe:2.3:a:vendor:product:version:update:edition:language:sw_edition:target_sw:target_hw:other
        try:
            parts = cpe_name.split(":")
            if len(parts) >= 6:
                return {
                    "vendor": parts[3] if parts[3] != "*" else None,
                    "product": parts[4] if parts[4] != "*" else None,
                    "version": parts[5] if parts[5] != "*" else None
                }
        except (IndexError, AttributeError):
            pass
        
        return {"vendor": None, "product": None, "version": None}
    
    def calculate_match_score(self, search_vendor: str, search_product: str, search_version: Optional[str],
                            cpe_result: CPESearchResult) -> float:
        """CPE 결과와 검색 조건 간의 매칭 점수 계산 (0.0 - 1.0)"""
        score = 0.0
        total_weight = 0.0
        
        # Vendor 매칭 (가중치: 0.3)
        vendor_weight = 0.3
        if search_vendor and cpe_result.vendor:
            vendor_similarity = self._calculate_string_similarity(search_vendor.lower(), cpe_result.vendor.lower())
            score += vendor_similarity * vendor_weight
        total_weight += vendor_weight
        
        # Product 매칭 (가중치: 0.5)
        product_weight = 0.5
        if search_product and cpe_result.product:
            product_similarity = self._calculate_string_similarity(search_product.lower(), cpe_result.product.lower())
            score += product_similarity * product_weight
        total_weight += product_weight
        
        # Version 매칭 (가중치: 0.2)
        version_weight = 0.2
        if search_version and cpe_result.version:
            version_similarity = self._calculate_string_similarity(search_version.lower(), cpe_result.version.lower())
            score += version_similarity * version_weight
        elif not search_version or not cpe_result.version:
            # 버전 정보가 없는 경우 중립적으로 처리
            score += 0.5 * version_weight
        total_weight += version_weight
        
        return score / total_weight if total_weight > 0 else 0.0
    
    def _calculate_string_similarity(self, str1: str, str2: str) -> float:
        """두 문자열 간의 유사도 계산 (간단한 구현)"""
        if str1 == str2:
            return 1.0
        
        # 포함 관계 확인
        if str1 in str2 or str2 in str1:
            return 0.8
        
        # 간단한 단어 기반 매칭
        words1 = set(str1.split())
        words2 = set(str2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def find_best_cpe_match(self, vendor: str, product: str, version: Optional[str] = None) -> CPEMatchResult:
        """최적의 CPE 매칭 찾기"""
        try:
            # 1단계: Vendor + Product로 검색
            results = self.search_cpe_by_vendor_product(vendor, product, version)
            
            if not results:
                return CPEMatchResult(
                    success=False,
                    message="No CPE found",
                    results=[],
                    total_results=0
                )
            
            # 2단계: 매칭 점수 계산
            scored_results = []
            for result in results:
                score = self.calculate_match_score(vendor, product, version, result)
                result.match_score = score
                scored_results.append(result)
            
            # 점수순으로 정렬
            scored_results.sort(key=lambda x: x.match_score, reverse=True)
            
            # 3단계: 신뢰도 결정
            best_score = scored_results[0].match_score if scored_results else 0.0
            confidence = best_score
            
            # 최고 점수가 0.8 이상이면 자동 매칭
            recommended_cpe = None
            message = "CPE candidates found"
            
            if best_score >= 0.8:
                recommended_cpe = scored_results[0].cpe_name
                message = f"High confidence match found (score: {best_score:.2f})"
            elif best_score >= 0.6:
                recommended_cpe = scored_results[0].cpe_name
                message = f"Moderate confidence match found (score: {best_score:.2f})"
            else:
                message = f"Low confidence matches found (best score: {best_score:.2f})"
            
            return CPEMatchResult(
                success=True,
                message=message,
                results=scored_results[:10],  # 상위 10개만 반환
                total_results=len(results),
                confidence_score=confidence,
                recommended_cpe=recommended_cpe
            )
            
        except Exception as e:
            logger.error(f"CPE 매칭 중 오류 발생: {str(e)}")
            return CPEMatchResult(
                success=False,
                message=f"Error during CPE matching: {str(e)}",
                results=[],
                total_results=0
            )

# 싱글톤 인스턴스
_nvd_client_instance = None

def get_nvd_cpe_client() -> NVDCPEClient:
    """NVD CPE 클라이언트 싱글톤 인스턴스 반환"""
    global _nvd_client_instance
    if _nvd_client_instance is None:
        _nvd_client_instance = NVDCPEClient()
    return _nvd_client_instance
