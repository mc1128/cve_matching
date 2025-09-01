이 스키마는 자산 관리와 CVE 취약점 관리를 효율적으로 연결하는 데 최적화되어 있습니다.

## ️ 최종 통합 데이터베이스 스키마
1. Users (사용자)
역할: 시스템 사용자와 자산 담당자를 관리합니다.

컬럼 이름	데이터 타입 (PostgreSQL)	설명	키
user_id	SERIAL	사용자 고유 ID (자동 증가)	PK
user_name	VARCHAR(100)	사용자 이름	
email	VARCHAR(255)	이메일 주소 (알림 발송용)
department	VARCHAR(100)	소속 부서	
created_at	TIMESTAMP WITH TIME ZONE	생성 일시 (기본값: NOW())	
updated_at	TIMESTAMP WITH TIME ZONE	수정 일시	
 

2. Assets (자산 마스터)
역할: 물리적 또는 가상 자산의 '껍데기' 정보만 관리합니다.

컬럼 이름	데이터 타입 (PostgreSQL)	설명	키
asset_id	SERIAL	자산 고유 ID (자동 증가)	PK
hostname	VARCHAR(255)	호스트명 (예: WebServer-Prod-01)	
ip_address	VARCHAR(45)	IP 주소	
asset_type	VARCHAR(50)	자산 유형 (예: Server, Laptop)	
owner_user_id	INTEGER	담당자 ID	FK (Users.user_id)
created_at	TIMESTAMP WITH TIME ZONE	생성 일시 (기본값: NOW())	
updated_at	TIMESTAMP WITH TIME ZONE	수정 일시	
 

3. Asset_Components (자산 구성요소)
역할: 자산에 속한 모든 '부품'(HW, SW, OS)의 목록이며, CVE를 빠르게 찾는 핵심 테이블입니다.

컬럼 이름	데이터 타입 (PostgreSQL)	설명	키
component_id	SERIAL	구성요소 고유 ID (자동 증가)	PK
asset_id	INTEGER	어떤 자산에 속해 있는지	FK (Assets.asset_id)
component_type	VARCHAR(50)	'Software', 'Hardware', 'OS' 중 하나	
vendor	VARCHAR(255)	제조사
product	VARCHAR(255)	제품명	
version	VARCHAR(100)	버전	
cpe_full_string	TEXT	Bedrock이 찾아준 정식 CPE 코드	
created_at	TIMESTAMP WITH TIME ZONE	생성 일시 (기본값: NOW())	
updated_at	TIMESTAMP WITH TIME ZONE	수정 일시	
 

4. CVE_MASTER (취약점 마스터)
역할: 수집된 모든 CVE 정보의 상세 데이터를 담는 원장 테이블입니다.

컬럼 이름	데이터 타입 (PostgreSQL)	설명	키
cve_id	VARCHAR(50)	CVE 고유 ID (예: CVE-2021-44228)	PK
cvss_score	NUMERIC(3, 1)	CVSS 점수 (예: 9.8)	
description	TEXT	취약점 상세 설명	
status	VARCHAR(50)	처리 상태	
is_favorite	BOOLEAN	즐겨찾기 여부 (기본값: FALSE)	
published_date	TIMESTAMP WITH TIME ZONE	공개일	
last_modified_date	TIMESTAMP WITH TIME ZONE	마지막 수정일	
cvss_severity	VARCHAR(20)	심각도 (예: CRITICAL, HIGH)	
cvss_vector	TEXT	CVSS 벡터 문자열	
weakness_type_cwe	VARCHAR(50)	CWE 취약점 유형 (예: CWE-79)	
ai_analysis_report	JSONB	AI 분석 리포트 (JSON 형태)	
ai_analysis_requested_at	TIMESTAMP WITH TIME ZONE	AI 분석 요청 시간	
ai_analysis_completed_at	TIMESTAMP WITH TIME ZONE	AI 분석 완료 시간	
ai_analysis_status	VARCHAR(20)	AI 분석 상태 (pending, processing, completed, failed, skipped)	
created_at	TIMESTAMP WITH TIME ZONE	생성일 (기본값: NOW())	
updated_at	TIMESTAMP WITH TIME ZONE	수정일	

**AI 분석 리포트 JSON 구조:**
```json
{
  "severity_analysis": {
    "risk_level": "Critical|High|Medium|Low",
    "business_impact": "High|Medium|Low", 
    "exploitability": "Easy|Medium|Hard"
  },
  "technical_analysis": {
    "attack_vector": "Network|Adjacent|Local|Physical",
    "attack_complexity": "Low|High",
    "privileges_required": "None|Low|High",
    "user_interaction": "None|Required"
  },
  "recommendations": ["권장사항1", "권장사항2", "..."],
  "affected_systems": ["시스템1", "시스템2", "..."],
  "analysis_summary": "AI 분석 요약 텍스트",
  "ai_confidence": 0.95,
  "analysis_version": "1.0"
}
```
 

5. CVE_AFFECTED_CPES (영향받는 CPE 목록)
역할: 하나의 CVE가 어떤 제품들(CPE)에 영향을 미치는지 정의하는 관계 테이블입니다.

컬럼 이름	데이터 타입 (PostgreSQL)	설명	키
id	SERIAL	자동 증가 ID	PK
cve_id	VARCHAR(50)	어떤 취약점에 대한 정보인지	FK (CVE_MASTER.cve_id)
cpe_full_string	TEXT	영향을 받는 제품의 원본 CPE 문자열	
vendor	VARCHAR(255)	제조사	
product	VARCHAR(255)	제품명	
version	VARCHAR(100)	버전	
created_at	TIMESTAMP WITH TIME ZONE	생성일 (기본값: NOW())	
 

6. CVE_REFERENCES (참고 자료)
역할: 하나의 CVE가 여러 참고 자료(URL)를 가질 수 있는 관계를 정의합니다.

컬럼 이름	데이터 타입 (PostgreSQL)	설명	키
id	SERIAL	자동 증가 ID	PK
cve_id	VARCHAR(50)	어떤 취약점에 대한 정보인지	FK (CVE_MASTER.cve_id)
url	TEXT	참고 URL	
created_at	TIMESTAMP WITH TIME ZONE	생성일 (기본값: NOW())	
 

 