-- CVE Master 테이블에 AI 분석 관련 컬럼 추가
-- 작성일: 2025-09-01

-- AI 분석 관련 컬럼 추가
ALTER TABLE cve_master 
ADD COLUMN ai_analysis_report JSONB,
ADD COLUMN ai_analysis_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ai_analysis_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ai_analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_analysis_status IN ('pending', 'processing', 'completed', 'failed', 'skipped'));

-- AI 분석 상태에 대한 코멘트 추가
COMMENT ON COLUMN cve_master.ai_analysis_report IS 'AI 분석 결과 리포트 (JSON 형태)';
COMMENT ON COLUMN cve_master.ai_analysis_requested_at IS 'AI 분석 요청 시간';
COMMENT ON COLUMN cve_master.ai_analysis_completed_at IS 'AI 분석 완료 시간';
COMMENT ON COLUMN cve_master.ai_analysis_status IS 'AI 분석 상태: pending(대기), processing(처리중), completed(완료), failed(실패), skipped(생략)';

-- AI 분석 상태별 인덱스 추가 (성능 최적화)
CREATE INDEX idx_cve_master_ai_status ON cve_master(ai_analysis_status);
CREATE INDEX idx_cve_master_ai_requested ON cve_master(ai_analysis_requested_at) WHERE ai_analysis_requested_at IS NOT NULL;

-- AI 분석 완료 시 자동으로 completed_at 업데이트하는 트리거 함수
CREATE OR REPLACE FUNCTION update_ai_analysis_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- AI 분석 상태가 'completed'로 변경될 때 완료 시간 자동 설정
    IF NEW.ai_analysis_status = 'completed' AND OLD.ai_analysis_status != 'completed' THEN
        NEW.ai_analysis_completed_at = NOW();
    END IF;
    
    -- AI 분석 상태가 'completed'가 아닌 다른 상태로 변경될 때 완료 시간 초기화
    IF NEW.ai_analysis_status != 'completed' AND OLD.ai_analysis_status = 'completed' THEN
        NEW.ai_analysis_completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_ai_analysis_completed
    BEFORE UPDATE ON cve_master
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_analysis_completed_at();

-- 샘플 AI 분석 데이터 업데이트
UPDATE cve_master 
SET 
    ai_analysis_requested_at = NOW() - INTERVAL '1 hour',
    ai_analysis_completed_at = NOW() - INTERVAL '30 minutes',
    ai_analysis_status = 'completed',
    ai_analysis_report = '{"severity_analysis": {"risk_level": "Critical", "business_impact": "High", "exploitability": "Easy"}, "technical_analysis": {"attack_vector": "Network", "attack_complexity": "Low", "privileges_required": "None", "user_interaction": "None"}, "recommendations": ["즉시 패치 적용 필요", "임시 완화 조치 적용", "네트워크 접근 제한"], "affected_systems": ["Apache Log4j 2.0-beta9 through 2.12.1", "Apache Log4j 2.13.0 through 2.15.0"], "analysis_summary": "Apache Log4j2의 JNDI 조회 기능을 악용한 원격 코드 실행 취약점. 공격자가 특별히 조작된 문자열을 로그에 기록하도록 유도하여 임의의 코드를 실행할 수 있습니다.", "ai_confidence": 0.95, "analysis_version": "1.0"}'::jsonb
WHERE cve_id = 'CVE-2021-44228';

-- CVE-2021-3156에 대한 AI 분석 진행 중 상태
UPDATE cve_master 
SET 
    ai_analysis_requested_at = NOW() - INTERVAL '10 minutes',
    ai_analysis_status = 'processing'
WHERE cve_id = 'CVE-2021-3156';

-- CVE-2022-0778은 분석 대기 상태
UPDATE cve_master 
SET 
    ai_analysis_requested_at = NOW() - INTERVAL '5 minutes',
    ai_analysis_status = 'pending'
WHERE cve_id = 'CVE-2022-0778';

-- AI 분석 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW ai_analysis_stats AS
SELECT 
    ai_analysis_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cve_master), 2) as percentage
FROM cve_master 
GROUP BY ai_analysis_status
ORDER BY count DESC;

-- AI 분석 대기열을 위한 뷰 생성
CREATE OR REPLACE VIEW ai_analysis_queue AS
SELECT 
    cve_id,
    cvss_score,
    cvss_severity,
    ai_analysis_status,
    ai_analysis_requested_at,
    (NOW() - ai_analysis_requested_at) as waiting_time
FROM cve_master 
WHERE ai_analysis_status IN ('pending', 'processing')
ORDER BY ai_analysis_requested_at ASC;

SELECT 'AI 분석 관련 컬럼 및 기능이 성공적으로 추가되었습니다!' as message;
