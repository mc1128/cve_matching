-- AI 분석 샘플 데이터 추가 및 테스트
-- 작성일: 2025-09-01

-- 먼저 현재 CVE 데이터 확인
SELECT cve_id, ai_analysis_status, ai_analysis_requested_at FROM cve_master;

-- CVE-2021-3156에 대한 AI 분석 완성
UPDATE cve_master 
SET 
    ai_analysis_requested_at = NOW() - INTERVAL '2 hours',
    ai_analysis_completed_at = NOW() - INTERVAL '1 hour',
    ai_analysis_status = 'completed',
    ai_analysis_report = '{"severity_analysis": {"risk_level": "High", "business_impact": "Medium", "exploitability": "Medium"}, "technical_analysis": {"attack_vector": "Local", "attack_complexity": "Low", "privileges_required": "Low", "user_interaction": "None"}, "recommendations": ["sudo 패키지 즉시 업데이트", "사용자 권한 검토", "로그 모니터링 강화"], "affected_systems": ["Sudo before 1.9.5p2"], "analysis_summary": "Sudo의 힙 기반 버퍼 오버플로우 취약점으로 권한 상승이 가능합니다. 로컬 사용자가 root 권한을 획득할 수 있는 심각한 취약점입니다.", "ai_confidence": 0.92, "analysis_version": "1.0"}'::jsonb
WHERE cve_id = 'CVE-2021-3156';

-- CVE-2022-0778에 대한 AI 분석 요청
UPDATE cve_master 
SET 
    ai_analysis_requested_at = NOW() - INTERVAL '30 minutes',
    ai_analysis_status = 'pending'
WHERE cve_id = 'CVE-2022-0778';

-- 새로운 CVE 추가 (더 다양한 테스트를 위해)
INSERT INTO cve_master (cve_id, cvss_score, description, cvss_severity, published_date, weakness_type_cwe, ai_analysis_status, ai_analysis_requested_at) 
VALUES 
('CVE-2021-45046', 9.0, 'Apache Log4j2 versions 2.0-beta7 through 2.17.0 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints.', 'CRITICAL', '2021-12-14', 'CWE-20', 'pending', NOW() - INTERVAL '45 minutes'),
('CVE-2023-23397', 9.8, 'Microsoft Outlook Elevation of Privilege Vulnerability', 'HIGH', '2023-03-14', 'CWE-20', 'processing', NOW() - INTERVAL '20 minutes')
ON CONFLICT (cve_id) DO UPDATE SET
    ai_analysis_status = EXCLUDED.ai_analysis_status,
    ai_analysis_requested_at = EXCLUDED.ai_analysis_requested_at;

-- AI 분석 통계 뷰 확인
SELECT * FROM ai_analysis_stats;

-- AI 분석 대기열 확인
SELECT * FROM ai_analysis_queue;

SELECT 'AI 분석 샘플 데이터가 성공적으로 추가되었습니다!' as message;
