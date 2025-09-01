# CVE Matching System
보안취약점 자동조치 AGENT

## 🎯 프로젝트 목적
기업 IT 자산의 보안취약점을 자동으로 탐지하고 분석하여, 담당자에게 적시에 알림을 제공하는 지능형 보안 관리 시스템

## 🔧 주요 기능
- **자동 CVE 수집**: NVD API를 통한 실시간 취약점 정보 수집
- **지능형 필터링**: 기업 환경에 적용 가능한 중요 취약점만 선별
- **AI 기반 CPE 매칭**: 자산과 취약점 자동 매칭 및 CPE 코드 생성
- **자산 취약점 분석**: 보유 자산의 취약점 현황 실시간 모니터링
- **자동 알림 시스템**: 담당자별 맞춤형 취약점 알림 이메일 발송
- **대시보드**: 취약점 현황 시각화 및 관리 인터페이스

## 🚀 시스템 워크플로우

### 1단계: CVE 데이터 수집 및 저장
```
NVD API → 데이터 전처리 → 중요도 필터링 → CVE DB 저장
```
- **NVD API 연동**: 실시간 CVE 정보 수집
- **데이터 전처리**: API 응답을 DB 스키마에 맞게 변환
- **중요도 기반 필터링**: 
  - CVSS Score 7.0 이상 (HIGH, CRITICAL)
  - 기업 환경 관련 취약점 (웹, 서버, 네트워크 등)
  - 최신 취약점 우선 처리

### 2단계: CPE 정보 관리
```
CVE 등록 → CPE 존재 확인 → 주기적 CPE 체크 → AI 기반 CPE 생성
```
- **신규 CVE**: CPE 정보 없는 경우 대기 상태로 관리
- **일일 CPE 체크**: 하루 1회 CPE 정보 업데이트 확인
- **AI CPE 생성**: 7일 이상 CPE 미제공 시 AI가 적절한 CPE 코드 생성

### 3단계: 자산 취약점 매칭
```
CPE 확보 → 자산 DB 스캔 → 취약점 매칭 → 위험도 분석
```
- **자동 매칭**: CPE 코드 기반 자산-취약점 연관성 분석
- **자산 CPE 보완**: 자산에 CPE 정보 없을 경우 AI가 자동 할당
- **위험도 평가**: 자산 중요도 × CVE 심각도로 우선순위 결정

### 4단계: AI 분석 및 알림
```
취약점 발견 → AI 영향도 분석 → 요약 리포트 생성 → 담당자 알림
```
- **AI 분석**: 취약점의 기업 환경 영향도 및 대응 방안 분석
- **맞춤형 리포트**: 담당자별 관리 자산 취약점 요약
- **자동 이메일**: 긴급도에 따른 즉시/일일/주간 알림

## 🏗️ 시스템 아키텍처

### Backend (Python + FastAPI)
- **CVE Collector**: NVD API 연동 및 데이터 수집
- **CPE Manager**: CPE 정보 관리 및 AI 기반 생성
- **Asset Matcher**: 자산-취약점 매칭 엔진
- **AI Analyzer**: AWS Bedrock 기반 취약점 분석
- **Notification Engine**: 이메일 알림 시스템

### Frontend (Next.js)
- **대시보드**: 취약점 현황 시각화
- **자산 관리**: IT 자산 등록 및 관리
- **취약점 분석**: CVE 상세 정보 및 영향도 분석
- **알림 설정**: 담당자별 알림 규칙 관리

### Database (Aurora PostgreSQL)
- **CVE Master**: 취약점 정보 및 AI 분석 결과
- **Assets**: IT 자산 정보 및 CPE 매핑
- **Users**: 사용자 및 담당자 정보
- **Notifications**: 알림 이력 및 설정

## 📊 데이터베이스 설정 (Aurora PostgreSQL)

### 환경 변수 설정
`.env.local` 파일에 Aurora PostgreSQL 연결 정보를 설정하세요:

```bash
# Aurora PostgreSQL RDS 설정
RDS_HOST=your-aurora-cluster-endpoint.cluster-xxxxxxxxx.us-east-1.rds.amazonaws.com
RDS_USER=postgres
RDS_PASSWORD=your_password
RDS_DATABASE=dashboard_db
RDS_PORT=5432

# AWS 설정
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

### 데이터베이스 연결 테스트
```bash
npm run db:test
```

### 데이터베이스 초기화
```bash
npm run db:init
```

### VS Code에서 데이터베이스 연결
1. SQLTools 확장 프로그램이 설치되어 있는지 확인
2. VS Code 좌측 사이드바에서 SQLTools 아이콘 클릭
3. "Aurora PostgreSQL" 연결 선택
4. 연결 후 SQL 쿼리 실행 가능

## 개발 서버 실행
```bash
npm run dev
```

## 🛠️ 기술 스택

### Backend
- **Python 3.12**: 메인 백엔드 언어
- **FastAPI**: 고성능 비동기 웹 프레임워크
- **SQLAlchemy**: ORM 및 데이터베이스 연동
- **Celery**: 비동기 작업 처리 (CVE 수집, AI 분석)
- **Redis**: 캐싱 및 작업 큐

### AI & ML
- **AWS Bedrock**: 취약점 분석 및 CPE 생성 AI
- **Langchain**: AI 워크플로우 관리
- **OpenAI GPT**: 보조 분석 및 리포트 생성

### Frontend
- **Next.js 14**: React 기반 웹 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **Chart.js**: 데이터 시각화

### Database & Infrastructure
- **Aurora PostgreSQL**: 메인 데이터베이스
- **AWS RDS**: 데이터베이스 호스팅
- **Docker**: 컨테이너화
- **GitHub Actions**: CI/CD

## 📋 구현 계획

### Phase 1: 기반 시스템 구축 ✅
- [x] 데이터베이스 스키마 설계 및 구축
- [x] Python 환경 및 데이터베이스 연동
- [x] AI 분석 기능 구조 설계
- [x] 기본 데이터 모델 클래스 구현

### Phase 2: CVE 데이터 수집 시스템 🚧
- [ ] NVD API 연동 모듈 개발
- [ ] CVE 데이터 전처리 및 필터링 로직
- [ ] 자동 스케줄링 시스템 (Celery + Redis)
- [ ] 중요도 기반 CVE 선별 알고리즘

### Phase 3: CPE 관리 및 AI 분석 🔄
- [ ] CPE 정보 수집 및 관리 시스템
- [ ] AI 기반 CPE 코드 생성 (AWS Bedrock)
- [ ] 자산-취약점 매칭 엔진
- [ ] AI 취약점 영향도 분석

### Phase 4: 알림 및 대시보드 🎯
- [ ] 이메일 알림 시스템
- [ ] Next.js 대시보드 백엔드 연동
- [ ] 실시간 모니터링 기능
- [ ] 담당자별 맞춤 알림

### Phase 5: 최적화 및 배포 🚀
- [ ] 성능 최적화 및 스케일링
- [ ] 보안 강화 및 로깅
- [ ] 운영 환경 배포
- [ ] 모니터링 및 알림 시스템

## 🔄 자동화 프로세스

### 일일 작업 (Daily Tasks)
- **06:00**: NVD에서 새로운 CVE 수집
- **07:00**: 중요도 기반 CVE 필터링 및 DB 저장
- **08:00**: CPE 정보 업데이트 확인
- **09:00**: 자산-취약점 매칭 및 AI 분석
- **10:00**: 긴급 취약점 즉시 알림 발송

### 주간 작업 (Weekly Tasks)
- **월요일**: 지난 주 취약점 요약 리포트
- **수요일**: 자산 CPE 정보 전수 검토
- **금요일**: AI 분석 정확도 검증 및 개선

### 월간 작업 (Monthly Tasks)
- 취약점 트렌드 분석 리포트
- 자산 보안 상태 종합 평가
- AI 모델 재학습 및 최적화

## 🚨 알림 체계

### 긴급도별 알림 규칙
- **🚨 Critical (즉시)**: CVSS 9.0+ 취약점 발견 시
- **🔴 High (2시간 내)**: CVSS 7.0-8.9 중요 자산 영향
- **🟡 Medium (일일)**: CVSS 4.0-6.9 일반 취약점
- **🟢 Low (주간)**: CVSS 0.1-3.9 낮은 위험도

### 알림 채널
- **이메일**: 담당자별 맞춤 리포트
- **슬랙**: 팀 채널 실시간 알림 (향후 구현)
- **대시보드**: 웹 인터페이스 알림

## 🔍 모니터링 지표

### 시스템 성능
- CVE 수집 성공률 (목표: 99.5%+)
- AI 분석 정확도 (목표: 95%+)
- 알림 발송 성공률 (목표: 99%+)
- 시스템 응답 시간 (목표: <2초)

### 보안 효과
- 취약점 탐지 시간 단축률
- 패치 적용 추적률
- 보안 사고 예방률
- 담당자 대응 속도

## 📁 프로젝트 구조
```
cve_matching/
├── backend/                 # Python 백엔드
│   ├── app/
│   │   ├── api/            # FastAPI 라우터
│   │   ├── core/           # 설정 및 보안
│   │   ├── services/       # 비즈니스 로직
│   │   ├── models/         # 데이터 모델
│   │   └── tasks/          # Celery 작업
│   ├── tests/              # 테스트 코드
│   └── requirements.txt    # Python 의존성
├── frontend/               # Next.js 프론트엔드
│   ├── components/         # React 컴포넌트
│   ├── pages/             # 페이지 라우팅
│   ├── lib/               # 유틸리티
│   └── styles/            # 스타일 시트
├── database/              # 데이터베이스 관련
│   ├── migrations/        # 스키마 변경
│   └── sql/              # SQL 스크립트
├── docs/                  # 문서
└── docker/               # Docker 설정
```

## 🤔 추가 고려사항

다음 항목들에 대해서도 검토가 필요할 것 같습니다:

### 1. CVE 필터링 기준 세부화
- 어떤 산업군/기술 스택을 우선적으로 모니터링할지?
- CVSS 점수 외에 추가 필터링 조건이 있는지?
- False Positive 줄이기 위한 화이트리스트 관리?

### 2. 자산 관리 방식
- 자산 정보는 어떻게 수집하고 업데이트할지?
- 자산 담당자 정보는 어떻게 관리할지?
- 자산 분류 체계 (중요도, 환경별 등)?

### 3. AI 분석 범위
- AI가 분석할 구체적인 항목들?
- 분석 결과의 검증 및 피드백 프로세스?
- AI 모델 업데이트 주기 및 방법?

### 4. 알림 상세 규칙
- 담당자별 알림 선호도 설정?
- 알림 중복 방지 로직?
- 긴급상황 시 에스컬레이션 절차?

### 5. 보안 및 규정 준수
- 개인정보 처리 방침?
- 감사 로그 및 추적성?
- 외부 API 사용 시 보안 고려사항?

이러한 부분들에 대해 추가 논의가 필요하신지 알려주세요!
