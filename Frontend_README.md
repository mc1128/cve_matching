# CVE Matching System - Frontend Documentation

## 📋 개요
이 프론트엔드는 v0.app에서 생성된 CVE 보안 센터 대시보드를 기반으로 구축되었으며, Next.js 15와 React 19를 사용하여 현대적인 사용자 인터페이스를 제공합니다.

## 🏗️ 아키텍처 구조

### 기술 스택
- **Framework**: Next.js 15.2.4 (App Router)
- **React Version**: React 19 (최신)
- **Styling**: Tailwind CSS 4.1.9 + shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts 2.8.0 (React 19 호환)
- **Forms**: React Hook Form + Zod 검증
- **Animation**: Framer Motion
- **Icons**: Lucide React

### 폴더 구조
```
frontend/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 메인 대시보드 (CVE 개요)
│   ├── devices/                  # 장치 관리 페이지
│   │   ├── page.tsx             # 디바이스 목록 및 상태
│   │   └── loading.tsx          # 로딩 컴포넌트
│   ├── security/                # 보안 분석 페이지
│   │   ├── page.tsx             # 보안 상태 분석
│   │   └── loading.tsx          # 로딩 컴포넌트
│   ├── layout.tsx               # 루트 레이아웃
│   ├── globals.css              # 전역 스타일
│   └── not-found.tsx            # 404 페이지
├── components/                   # 재사용 가능한 컴포넌트
│   ├── dashboard/               # 대시보드 관련 컴포넌트
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   ├── stat/                # 통계 카드
│   │   ├── chart/               # 차트 컴포넌트
│   │   ├── security-status/     # 보안 상태 위젯
│   │   ├── notifications/       # 알림 시스템
│   │   ├── sidebar/             # 네비게이션 사이드바
│   │   └── widget/              # 범용 위젯
│   ├── chat/                    # 채팅/메시징 시스템
│   ├── ui/                      # shadcn/ui 기본 컴포넌트
│   └── icons/                   # 커스텀 아이콘
├── types/                       # TypeScript 타입 정의
│   ├── dashboard.ts             # 대시보드 관련 타입
│   └── chat.ts                  # 채팅 관련 타입
├── hooks/                       # 커스텀 훅
├── data/                        # 모목 데이터
└── mock.json                    # 현재 사용 중인 모목 데이터
```

## 🎯 주요 기능 영역

### 1. 대시보드 메인 페이지 (`/`)
- **통계 카드**: 일일 새로운 CVE, 분석 대기, 크리티컬 자산
- **차트 분석**: 시간별 CVE 발견 트렌드, 심각도별 분포
- **보안 상태**: 전체적인 시스템 보안 현황
- **실시간 알림**: 새로운 취약점 발견 시 알림

### 2. 디바이스 관리 페이지 (`/devices`)
- **자산 목록**: 모니터링 중인 장비 및 시스템
- **CVE 매칭**: 각 디바이스별 해당 취약점 매칭 결과
- **위험도 평가**: CVSS 점수 기반 위험도 시각화
- **패치 우선순위**: 수정 권장 순서

### 3. 보안 분석 페이지 (`/security`)
- **취약점 상세 분석**: CVE 세부 정보 및 영향도
- **AI 분석 결과**: Bedrock AI 기반 위험 평가
- **대응 방안**: 권장 보안 조치사항
- **트렌드 분석**: 취약점 발견 패턴 분석

## 🔧 핵심 컴포넌트

### DashboardStat
```typescript
interface DashboardStat {
  label: string              // 통계 라벨
  value: string             // 수치 값
  description: string       // 설명
  intent: "positive" | "negative" | "neutral"  // 색상 의도
  icon: string             // 아이콘 식별자
  tag?: string             // 추가 태그
  direction?: "up" | "down" // 트렌드 방향
}
```

### ChartDataPoint
```typescript
interface ChartDataPoint {
  date: string             // 날짜
  critical: number         // 크리티컬 취약점 수
  high: number            // 높음 취약점 수
  medium: number          // 중간 취약점 수
}
```

### RebelRanking (CVE 순위)
```typescript
interface RebelRanking {
  id: number              // 고유 ID
  name: string           // CVE 식별자
  handle: string         // 심각도 수준
  description: string    // 취약점 설명
  score: number         // CVSS 점수
}
```

## 🎨 UI/UX 특징

### 디자인 시스템
- **컬러 팔레트**: 사이버 보안 테마 (블루, 레드, 그린)
- **타이포그래피**: Geist 폰트 패밀리
- **레이아웃**: 반응형 그리드 시스템
- **애니메이션**: 부드러운 전환 효과

### 반응형 지원
- **Desktop**: 풀 기능 대시보드
- **Tablet**: 적응형 레이아웃
- **Mobile**: 모바일 최적화 인터페이스

## 🔌 백엔드 통합 준비사항

### API 엔드포인트 요구사항

1. **CVE 데이터 API**
   ```
   GET /api/cve/dashboard-stats    # 대시보드 통계
   GET /api/cve/recent            # 최근 CVE 목록
   GET /api/cve/{id}              # CVE 상세 정보
   ```

2. **디바이스 관리 API**
   ```
   GET /api/devices               # 디바이스 목록
   GET /api/devices/{id}/cves     # 디바이스별 CVE 매칭
   POST /api/devices/{id}/scan    # 새로운 스캔 요청
   ```

3. **보안 분석 API**
   ```
   GET /api/analysis/trends       # 트렌드 분석 데이터
   GET /api/analysis/ai/{cve_id}  # AI 분석 결과
   POST /api/analysis/request     # 분석 요청
   ```

### 데이터 모델 매핑

#### 현재 Mock 데이터 → 백엔드 연동 계획
```typescript
// Mock에서 실제 API로 전환
const mockData = {
  dashboardStats: [...],  // → GET /api/cve/dashboard-stats
  chartData: {...},       // → GET /api/analysis/trends
  notifications: [...],   // → WebSocket /ws/notifications
  rebelRankings: [...]   // → GET /api/cve/critical-list
}
```

## 🚀 환경 설정

### 개발 환경 실행
```bash
cd frontend
npm install --legacy-peer-deps  # React 19 호환성
npm run dev                     # 개발 서버 시작 (포트 3000)
```

### 환경 변수 설정
```env
# .env.local 파일 생성 필요
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_ENV=development
```

### 빌드 & 배포
```bash
npm run build                   # 프로덕션 빌드
npm run start                   # 프로덕션 서버 시작
```

## 🔄 백엔드 통합 단계별 계획

### Phase 1: API 연결 기초 작업
1. **환경 변수 설정**: API URL 및 인증 토큰
2. **API 클라이언트 생성**: axios 기반 HTTP 클라이언트
3. **타입 정의 업데이트**: 백엔드 스키마에 맞는 TypeScript 인터페이스

### Phase 2: 데이터 패칭 구현
1. **커스텀 훅 생성**: useCVEData, useDevices, useAnalysis
2. **상태 관리 통합**: Zustand 스토어에 실제 데이터 연결
3. **로딩/에러 상태**: 적절한 UX 처리

### Phase 3: 실시간 기능 구현
1. **WebSocket 연결**: 실시간 CVE 알림
2. **푸시 알림**: 새로운 취약점 발견 시 즉시 알림
3. **자동 새로고침**: 정기적인 데이터 업데이트

### Phase 4: 고급 기능 추가
1. **사용자 인증**: 로그인/권한 관리
2. **설정 관리**: 사용자별 대시보드 커스터마이징
3. **데이터 내보내기**: CVE 리포트 생성

## 📊 성능 최적화

### 현재 적용된 최적화
- **코드 분할**: Next.js 자동 코드 스플리팅
- **이미지 최적화**: Next.js Image 컴포넌트
- **번들 크기 최적화**: 트리 셰이킹 및 의존성 최적화

### 추가 최적화 계획
- **메모이제이션**: React.memo, useMemo 적용
- **가상화**: 대용량 리스트 가상 스크롤링
- **캐싱**: React Query 또는 SWR 도입

## 🧪 테스트 전략

### 현재 상태
- **타입 체킹**: TypeScript 정적 타입 검사
- **린팅**: ESLint 코드 품질 관리

### 테스트 계획
- **단위 테스트**: Jest + Testing Library
- **통합 테스트**: API 연동 테스트
- **E2E 테스트**: Playwright 또는 Cypress

## 🔧 현재 알려진 이슈 및 해결 방안

### 해결 완료
- ✅ React 19 호환성 문제 (recharts 다운그레이드)
- ✅ Fragment key prop 경고 (React.Fragment 사용)
- ✅ 의존성 충돌 (--legacy-peer-deps)

### 향후 개선 필요
- 🔄 실제 데이터 연동 (현재 mock 데이터 사용)
- 🔄 WebSocket 실시간 통신 구현
- 🔄 사용자 인증 시스템 통합
- 🔄 반응형 최적화 (모바일 UX 개선)

## 📞 백엔드 팀과의 협의 사항

1. **API 스펙 정의**: RESTful API 엔드포인트 및 스키마
2. **인증 방식**: JWT 토큰 또는 세션 기반 인증
3. **WebSocket 프로토콜**: 실시간 알림 구현 방식
4. **에러 핸들링**: 표준화된 에러 응답 형식
5. **페이지네이션**: 대용량 데이터 처리 방식

---

**문서 작성일**: 2025년 9월 2일  
**마지막 업데이트**: Frontend v0.1.0 (Next.js 15 + React 19)  
**담당자**: Frontend Development Team
