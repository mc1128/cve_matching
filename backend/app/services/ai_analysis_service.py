"""
AI Analysis Service using AWS Bedrock
CPE 매칭 결과를 AI로 분석하여 최적의 선택을 제공
"""

import boto3
import json
import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import time

from .nvd_cpe_client import CPESearchResult, CPEMatchResult

logger = logging.getLogger(__name__)

@dataclass
class AIAnalysisResult:
    """AI 분석 결과"""
    success: bool
    message: str
    recommended_cpe: Optional[str] = None
    confidence_score: float = 0.0
    reasoning: str = ""
    should_manual_review: bool = False

class BedrockAIService:
    """AWS Bedrock AI 분석 서비스"""
    
    def __init__(self):
        self.region_name = os.getenv("AWS_REGION", "us-east-1")
        self.model_id = os.getenv("AI_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
        self.ai_enabled = os.getenv("AI_ANALYSIS_ENABLED", "true").lower() == "true"
        
        if self.ai_enabled:
            try:
                # AWS Bedrock 클라이언트 초기화
                self.bedrock_client = boto3.client(
                    "bedrock-runtime",
                    region_name=self.region_name,
                    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
                )
                logger.info(f"✅ AWS Bedrock client initialized with model: {self.model_id}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize AWS Bedrock client: {str(e)}")
                self.ai_enabled = False
        else:
            logger.info("🔍 AI analysis is disabled")
    
    def analyze_cpe_matches(self, 
                          vendor: str, 
                          product: str, 
                          version: Optional[str],
                          cpe_results: List[CPESearchResult]) -> AIAnalysisResult:
        """CPE 매칭 결과를 AI로 분석"""
        
        if not self.ai_enabled:
            return AIAnalysisResult(
                success=False,
                message="AI analysis is disabled",
                should_manual_review=True
            )
        
        if not cpe_results:
            return AIAnalysisResult(
                success=False,
                message="No CPE results to analyze",
                should_manual_review=True
            )
        
        try:
            # AI 분석 프롬프트 생성
            prompt = self._create_analysis_prompt(vendor, product, version, cpe_results)
            
            # Bedrock API 호출
            response = self._call_bedrock_api(prompt)
            
            if response:
                return self._parse_ai_response(response, cpe_results)
            else:
                return AIAnalysisResult(
                    success=False,
                    message="Failed to get AI response",
                    should_manual_review=True
                )
                
        except Exception as e:
            logger.error(f"AI 분석 중 오류: {str(e)}")
            return AIAnalysisResult(
                success=False,
                message=f"AI analysis error: {str(e)}",
                should_manual_review=True
            )
    
    def _create_analysis_prompt(self, 
                              vendor: str, 
                              product: str, 
                              version: Optional[str],
                              cpe_results: List[CPESearchResult]) -> str:
        """AI 분석을 위한 프롬프트 생성"""
        
        # 검색 조건
        search_info = f"""
검색 조건:
- Vendor: {vendor}
- Product: {product}
- Version: {version if version else 'Not specified'}
"""
        
        # CPE 후보들
        candidates_info = "\nCPE 후보들:\n"
        for i, cpe in enumerate(cpe_results[:5], 1):  # 상위 5개만 분석
            candidates_info += f"""
{i}. CPE: {cpe.cpe_name}
   - Title: {cpe.title}
   - Vendor: {cpe.vendor or 'N/A'}
   - Product: {cpe.product or 'N/A'}
   - Version: {cpe.version or 'N/A'}
   - Match Score: {cpe.match_score:.2f}
   - Deprecated: {cpe.deprecated}
"""
        
        prompt = f"""
당신은 사이버보안 전문가이며 CPE(Common Platform Enumeration) 매칭 분석을 수행합니다.

주어진 소프트웨어/하드웨어 정보와 CPE 후보들을 분석하여 가장 적합한 CPE를 선택해주세요.

{search_info}
{candidates_info}

분석 기준:
1. Vendor 이름 정확성 (공식 vendor 이름과 일치하는가?)
2. Product 이름 정확성 (정확한 제품명인가?)
3. Version 호환성 (버전이 정확하거나 호환되는가?)
4. CPE의 최신성 (deprecated 되지 않았는가?)
5. 제품의 신뢰성 (잘 알려진 공식 제품인가?)

응답 형식 (JSON):
{{
    "recommended_cpe": "선택된 CPE 또는 null",
    "confidence_score": 0.0-1.0,
    "reasoning": "선택 이유 설명",
    "should_manual_review": true/false,
    "analysis_summary": "간단한 분석 요약"
}}

규칙:
- confidence_score가 0.7 이상이면 recommended_cpe 제공
- confidence_score가 0.5 미만이면 should_manual_review를 true로 설정
- deprecated된 CPE는 피하기
- 정확한 매칭이 없으면 should_manual_review를 true로 설정

JSON 형식으로만 응답해주세요.
"""
        
        return prompt
    
    def _call_bedrock_api(self, prompt: str) -> Optional[str]:
        """AWS Bedrock API 호출"""
        try:
            # Claude 3 모델용 메시지 형식
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": messages,
                "temperature": 0.1,  # 일관성 있는 응답을 위해 낮은 temperature
                "top_p": 0.9
            }
            
            response = self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json"
            )
            
            response_body = json.loads(response["body"].read())
            
            # Claude 응답에서 텍스트 추출
            if "content" in response_body and response_body["content"]:
                return response_body["content"][0]["text"]
            
            return None
            
        except Exception as e:
            logger.error(f"Bedrock API 호출 실패: {str(e)}")
            return None
    
    def _parse_ai_response(self, ai_response: str, cpe_results: List[CPESearchResult]) -> AIAnalysisResult:
        """AI 응답 파싱"""
        try:
            # JSON 응답 파싱
            ai_data = json.loads(ai_response.strip())
            
            recommended_cpe = ai_data.get("recommended_cpe")
            confidence_score = float(ai_data.get("confidence_score", 0.0))
            reasoning = ai_data.get("reasoning", "")
            should_manual_review = ai_data.get("should_manual_review", False)
            analysis_summary = ai_data.get("analysis_summary", "")
            
            # 추천된 CPE가 실제 결과에 있는지 확인
            if recommended_cpe:
                valid_cpe = any(cpe.cpe_name == recommended_cpe for cpe in cpe_results)
                if not valid_cpe:
                    logger.warning(f"AI가 추천한 CPE가 검색 결과에 없음: {recommended_cpe}")
                    recommended_cpe = None
                    should_manual_review = True
            
            message = analysis_summary if analysis_summary else "AI analysis completed"
            
            return AIAnalysisResult(
                success=True,
                message=message,
                recommended_cpe=recommended_cpe,
                confidence_score=confidence_score,
                reasoning=reasoning,
                should_manual_review=should_manual_review
            )
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"AI 응답 파싱 실패: {str(e)}\nResponse: {ai_response}")
            
            # 파싱 실패 시 수동 검토 요청
            return AIAnalysisResult(
                success=False,
                message="Failed to parse AI response",
                should_manual_review=True,
                reasoning=f"AI response parsing error: {str(e)}"
            )

# 싱글톤 인스턴스
_ai_service_instance = None

def get_ai_service() -> BedrockAIService:
    """AI 서비스 싱글톤 인스턴스 반환"""
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = BedrockAIService()
    return _ai_service_instance
