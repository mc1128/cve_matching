-- ============================================================================
-- CVE Matching System - Aurora PostgreSQL 데이터베이스 스키마
-- 자산 관리와 CVE 취약점 관리를 위한 통합 데이터베이스
-- ============================================================================

-- 기존 테이블이 있다면 삭제 (개발 환경용 - 주의!)
-- DROP TABLE IF EXISTS cve_references CASCADE;
-- DROP TABLE IF EXISTS cve_affected_cpes CASCADE;
-- DROP TABLE IF EXISTS asset_components CASCADE;
-- DROP TABLE IF EXISTS cve_master CASCADE;
-- DROP TABLE IF EXISTS assets CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. Users (사용자 관리)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- ============================================================================
-- 2. Assets (자산 마스터)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
    asset_id SERIAL PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    asset_type VARCHAR(50) NOT NULL,
    owner_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자산 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_assets_hostname ON assets(hostname);
CREATE INDEX IF NOT EXISTS idx_assets_ip_address ON assets(ip_address);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_user_id);

-- ============================================================================
-- 3. CVE_MASTER (취약점 마스터)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cve_master (
    cve_id VARCHAR(50) PRIMARY KEY,
    cvss_score NUMERIC(3, 1),
    description TEXT,
    status VARCHAR(50) DEFAULT 'New',
    is_favorite BOOLEAN DEFAULT FALSE,
    published_date TIMESTAMP WITH TIME ZONE,
    last_modified_date TIMESTAMP WITH TIME ZONE,
    cvss_severity VARCHAR(20),
    cvss_vector TEXT,
    weakness_type_cwe VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVE 마스터 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_cve_master_cvss_score ON cve_master(cvss_score);
CREATE INDEX IF NOT EXISTS idx_cve_master_severity ON cve_master(cvss_severity);
CREATE INDEX IF NOT EXISTS idx_cve_master_status ON cve_master(status);
CREATE INDEX IF NOT EXISTS idx_cve_master_published_date ON cve_master(published_date);
CREATE INDEX IF NOT EXISTS idx_cve_master_favorite ON cve_master(is_favorite);

-- ============================================================================
-- 4. Asset_Components (자산 구성요소)
-- ============================================================================
CREATE TABLE IF NOT EXISTS asset_components (
    component_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL CHECK (component_type IN ('Software', 'Hardware', 'OS')),
    vendor VARCHAR(255),
    product VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    cpe_full_string TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자산 구성요소 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_asset_components_asset_id ON asset_components(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_components_type ON asset_components(component_type);
CREATE INDEX IF NOT EXISTS idx_asset_components_vendor ON asset_components(vendor);
CREATE INDEX IF NOT EXISTS idx_asset_components_product ON asset_components(product);
CREATE INDEX IF NOT EXISTS idx_asset_components_cpe ON asset_components(cpe_full_string);

-- ============================================================================
-- 5. CVE_AFFECTED_CPES (영향받는 CPE 목록)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cve_affected_cpes (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL REFERENCES cve_master(cve_id) ON DELETE CASCADE,
    cpe_full_string TEXT NOT NULL,
    vendor VARCHAR(255),
    product VARCHAR(255),
    version VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVE 영향 CPE 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_cve_affected_cpes_cve_id ON cve_affected_cpes(cve_id);
CREATE INDEX IF NOT EXISTS idx_cve_affected_cpes_cpe ON cve_affected_cpes(cpe_full_string);
CREATE INDEX IF NOT EXISTS idx_cve_affected_cpes_vendor_product ON cve_affected_cpes(vendor, product);

-- ============================================================================
-- 6. CVE_REFERENCES (참고 자료)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cve_references (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL REFERENCES cve_master(cve_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVE 참고자료 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_cve_references_cve_id ON cve_references(cve_id);

-- ============================================================================
-- 추가 테이블: Chat History (기존 시스템과의 호환성)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- ============================================================================
-- 트리거 함수: updated_at 자동 업데이트
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at 
    BEFORE UPDATE ON assets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cve_master_updated_at ON cve_master;
CREATE TRIGGER update_cve_master_updated_at 
    BEFORE UPDATE ON cve_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_components_updated_at ON asset_components;
CREATE TRIGGER update_asset_components_updated_at 
    BEFORE UPDATE ON asset_components 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 샘플 데이터 삽입
-- ============================================================================

-- 사용자 샘플 데이터
INSERT INTO users (user_name, email, department) VALUES 
    ('김철수', 'kim.cs@company.com', 'IT보안팀'),
    ('이영희', 'lee.yh@company.com', '인프라팀'),
    ('박민수', 'park.ms@company.com', '개발팀')
ON CONFLICT (email) DO NOTHING;

-- 자산 샘플 데이터
INSERT INTO assets (hostname, ip_address, asset_type, owner_user_id) VALUES 
    ('WEB-SERVER-01', '192.168.1.10', 'Server', 1),
    ('DB-SERVER-01', '192.168.1.20', 'Server', 2),
    ('DEV-LAPTOP-01', '192.168.1.100', 'Laptop', 3)
ON CONFLICT DO NOTHING;

-- CVE 마스터 샘플 데이터
INSERT INTO cve_master (
    cve_id, cvss_score, description, cvss_severity, 
    published_date, weakness_type_cwe
) VALUES 
    ('CVE-2021-44228', 9.8, 'Apache Log4j2 원격 코드 실행 취약점', 'CRITICAL', '2021-12-10', 'CWE-502'),
    ('CVE-2021-45046', 9.0, 'Apache Log4j2 서비스 거부 취약점', 'CRITICAL', '2021-12-14', 'CWE-20'),
    ('CVE-2023-23397', 8.8, 'Microsoft Outlook 권한 상승 취약점', 'HIGH', '2023-03-14', 'CWE-269')
ON CONFLICT (cve_id) DO NOTHING;

-- 자산 구성요소 샘플 데이터
INSERT INTO asset_components (
    asset_id, component_type, vendor, product, version, cpe_full_string
) VALUES 
    (1, 'Software', 'Apache', 'Log4j', '2.14.1', 'cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*'),
    (1, 'OS', 'Ubuntu', 'Ubuntu Linux', '20.04', 'cpe:2.3:o:canonical:ubuntu_linux:20.04:*:*:*:lts:*:*:*'),
    (2, 'Software', 'PostgreSQL', 'PostgreSQL', '13.7', 'cpe:2.3:a:postgresql:postgresql:13.7:*:*:*:*:*:*:*')
ON CONFLICT DO NOTHING;

-- CVE 영향 CPE 샘플 데이터
INSERT INTO cve_affected_cpes (
    cve_id, cpe_full_string, vendor, product, version
) VALUES 
    ('CVE-2021-44228', 'cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*', 'Apache', 'Log4j', '2.14.1'),
    ('CVE-2021-44228', 'cpe:2.3:a:apache:log4j:2.15.0:*:*:*:*:*:*:*', 'Apache', 'Log4j', '2.15.0'),
    ('CVE-2021-45046', 'cpe:2.3:a:apache:log4j:2.15.0:*:*:*:*:*:*:*', 'Apache', 'Log4j', '2.15.0')
ON CONFLICT DO NOTHING;

-- CVE 참고자료 샘플 데이터
INSERT INTO cve_references (cve_id, url) VALUES 
    ('CVE-2021-44228', 'https://nvd.nist.gov/vuln/detail/CVE-2021-44228'),
    ('CVE-2021-44228', 'https://logging.apache.org/log4j/2.x/security.html'),
    ('CVE-2021-45046', 'https://nvd.nist.gov/vuln/detail/CVE-2021-45046')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 뷰 생성: 자산별 취약점 매칭
-- ============================================================================
CREATE OR REPLACE VIEW asset_vulnerabilities AS
SELECT 
    a.asset_id,
    a.hostname,
    a.ip_address,
    ac.component_id,
    ac.vendor,
    ac.product,
    ac.version,
    cm.cve_id,
    cm.cvss_score,
    cm.cvss_severity,
    cm.description,
    cm.status
FROM assets a
JOIN asset_components ac ON a.asset_id = ac.asset_id
JOIN cve_affected_cpes cac ON ac.cpe_full_string = cac.cpe_full_string
JOIN cve_master cm ON cac.cve_id = cm.cve_id
ORDER BY a.asset_id, cm.cvss_score DESC;

-- ============================================================================
-- 유용한 쿼리 함수들
-- ============================================================================

-- 자산별 취약점 개수 조회 함수
CREATE OR REPLACE FUNCTION get_asset_vulnerability_count(asset_id_param INTEGER)
RETURNS TABLE(
    total_cves BIGINT,
    critical_cves BIGINT,
    high_cves BIGINT,
    medium_cves BIGINT,
    low_cves BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_cves,
        COUNT(CASE WHEN cm.cvss_severity = 'CRITICAL' THEN 1 END) as critical_cves,
        COUNT(CASE WHEN cm.cvss_severity = 'HIGH' THEN 1 END) as high_cves,
        COUNT(CASE WHEN cm.cvss_severity = 'MEDIUM' THEN 1 END) as medium_cves,
        COUNT(CASE WHEN cm.cvss_severity = 'LOW' THEN 1 END) as low_cves
    FROM assets a
    JOIN asset_components ac ON a.asset_id = ac.asset_id
    JOIN cve_affected_cpes cac ON ac.cpe_full_string = cac.cpe_full_string
    JOIN cve_master cm ON cac.cve_id = cm.cve_id
    WHERE a.asset_id = asset_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🎉 CVE Matching System 데이터베이스 스키마가 성공적으로 생성되었습니다!';
    RAISE NOTICE '📊 생성된 테이블: users, assets, cve_master, asset_components, cve_affected_cpes, cve_references, chat_history';
    RAISE NOTICE '🔍 생성된 뷰: asset_vulnerabilities';
    RAISE NOTICE '⚡ 생성된 함수: get_asset_vulnerability_count()';
    RAISE NOTICE '💾 샘플 데이터가 삽입되었습니다.';
END $$;
