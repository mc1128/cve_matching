-- PostgreSQL 스키마 생성
CREATE SCHEMA IF NOT EXISTS dashboard_schema;

-- 테이블 생성
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_id ON chat_history (user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON chat_history (created_at);
