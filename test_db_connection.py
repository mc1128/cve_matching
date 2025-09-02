#!/usr/bin/env python3
"""
Database Connection Test Script
Aurora PostgreSQL 연결 테스트
"""

import os
import sys
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

try:
    import psycopg2
    from sqlalchemy import create_engine, text
    
    # 환경변수에서 DB 정보 가져오기
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "postgres")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    
    print(f"🔍 Database Connection Test")
    print(f"Host: {DB_HOST}")
    print(f"Port: {DB_PORT}")
    print(f"Database: {DB_NAME}")
    print(f"User: {DB_USER}")
    print(f"Password: {'*' * len(DB_PASSWORD) if DB_PASSWORD else 'Not set'}")
    print("-" * 50)
    
    # SQLAlchemy 연결 테스트
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    print(f"📡 Attempting SQLAlchemy connection...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.scalar()
        print(f"✅ SQLAlchemy Connection Success!")
        print(f"PostgreSQL Version: {version}")
        
        # 테이블 목록 확인
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        tables = result.fetchall()
        
        print(f"\n📋 Available Tables ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
            
        # Assets 테이블 데이터 확인
        try:
            result = conn.execute(text("SELECT COUNT(*) FROM assets;"))
            assets_count = result.scalar()
            print(f"\n📊 Assets Table: {assets_count} records")
            
            if assets_count > 0:
                result = conn.execute(text("SELECT asset_id, hostname, asset_type FROM assets LIMIT 5;"))
                assets = result.fetchall()
                print("Sample Assets:")
                for asset in assets:
                    print(f"  - ID: {asset[0]}, Host: {asset[1]}, Type: {asset[2]}")
        except Exception as e:
            print(f"⚠️ Assets table query failed: {str(e)}")
    
except ImportError as e:
    print(f"❌ Import Error: {str(e)}")
    print("Required packages: psycopg2-binary, sqlalchemy")
    
except Exception as e:
    print(f"❌ Connection Failed: {str(e)}")
    print("\nPossible issues:")
    print("1. Aurora PostgreSQL instance not running")
    print("2. Security group not allowing connections")
    print("3. VPC/Network configuration")
    print("4. Incorrect credentials")
    print("5. Database endpoint not accessible from CodeSpaces")
    
    # psycopg2 직접 연결 시도
    try:
        print(f"\n🔄 Trying direct psycopg2 connection...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            connect_timeout=10
        )
        print("✅ Direct psycopg2 connection successful!")
        conn.close()
    except Exception as e2:
        print(f"❌ Direct psycopg2 connection also failed: {str(e2)}")
