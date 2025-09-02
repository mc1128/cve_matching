# 테스트 파일 가이드

이 폴더에는 CVE 매칭 시스템의 테스트 파일들이 있습니다.

## 핵심 테스트 파일

### CPE 매칭 관련
- `test_improved_cpe_matching.py` - 개선된 CPE 매칭 알고리즘 테스트
- `test_api_key_functionality.py` - NVD API 키 기능 테스트  
- `test_batch_cpe_matching.py` - 배치 CPE 매칭 테스트
- `cpe_auto_matcher.py` - CPE 자동 매칭 데모 스크립트

### AI 분석 관련
- `simple_ai_test.py` - AI 분석 기능 테스트

## 사용법

### CPE 매칭 테스트
```bash
# 개선된 CPE 매칭 테스트
python tests/test_improved_cpe_matching.py

# API 키 기능 테스트
python tests/test_api_key_functionality.py

# 배치 매칭 테스트
python tests/test_batch_cpe_matching.py
```

### AI 분석 테스트
```bash
# AI 분석 테스트
python tests/simple_ai_test.py
```

## 주의사항

- 모든 테스트는 프로젝트 루트 디렉토리에서 실행하세요
- NVD API 키가 `.env` 파일에 설정되어 있어야 합니다
- 데이터베이스 연결이 필요한 테스트는 실제 DB 환경에서 실행하세요

## 로그

테스트 실행 로그는 `tests/logs/` 디렉토리에 저장됩니다.
