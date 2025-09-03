"""
Memory Cache Service
간단한 메모리 기반 캐싱 서비스
"""

import time
from typing import Any, Dict, Optional
from functools import wraps
import json
import hashlib

class MemoryCache:
    """간단한 메모리 캐시 구현"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._default_ttl = 300  # 5분 기본 TTL
    
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """캐시 항목이 만료되었는지 확인"""
        return time.time() > entry['expires_at']
    
    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 가져오기"""
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if self._is_expired(entry):
            del self._cache[key]
            return None
        
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """캐시에 값 저장"""
        if ttl is None:
            ttl = self._default_ttl
        
        self._cache[key] = {
            'value': value,
            'expires_at': time.time() + ttl,
            'created_at': time.time()
        }
    
    def delete(self, key: str) -> None:
        """캐시에서 값 삭제"""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self) -> None:
        """전체 캐시 삭제"""
        self._cache.clear()
    
    def clear_pattern(self, pattern: str) -> int:
        """패턴에 맞는 캐시 키들 삭제"""
        matching_keys = [key for key in self._cache.keys() if pattern in key]
        for key in matching_keys:
            del self._cache[key]
        return len(matching_keys)
    
    def cleanup_expired(self) -> None:
        """만료된 캐시 항목들 정리"""
        expired_keys = [
            key for key, entry in self._cache.items() 
            if self._is_expired(entry)
        ]
        for key in expired_keys:
            del self._cache[key]

# 전역 캐시 인스턴스
cache = MemoryCache()

# 🔥 CPE 매칭 후 캐시 무효화를 위한 유틸리티 함수들
def invalidate_component_cache(component_id: int) -> None:
    """CPE 매칭 후 관련 캐시 무효화"""
    try:
        # 1. 컴포넌트 관련 캐시 무효화
        invalidated_count = 0
        
        # asset_components 관련 캐시 삭제
        invalidated_count += cache.clear_pattern("asset_components")
        
        # devices 관련 캐시 삭제
        invalidated_count += cache.clear_pattern("assets")
        
        # dashboard 통계 캐시 삭제
        invalidated_count += cache.clear_pattern("dashboard")
        
        print(f"🗑️ 캐시 무효화 완료: {invalidated_count}개 키 삭제 (component_id: {component_id})")
        
    except Exception as e:
        print(f"⚠️ 캐시 무효화 중 오류: {e}")

def invalidate_asset_cache(asset_id: int) -> None:
    """자산 관련 캐시 무효화"""
    try:
        invalidated_count = 0
        invalidated_count += cache.clear_pattern(f"asset_components")
        invalidated_count += cache.clear_pattern("assets")
        print(f"🗑️ 자산 캐시 무효화 완료: {invalidated_count}개 키 삭제 (asset_id: {asset_id})")
    except Exception as e:
        print(f"⚠️ 자산 캐시 무효화 중 오류: {e}")

def get_cache_info() -> Dict[str, Any]:
    """캐시 상태 정보 반환"""
    cache_keys = list(cache._cache.keys())
    return {
        "total_keys": len(cache_keys),
        "sample_keys": cache_keys[:5],  # 처음 5개 키만 샘플로
        "cache_stats": get_cache_stats()
    }

def cache_result(ttl: int = 300, key_prefix: str = ""):
    """함수 결과를 캐싱하는 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = _generate_cache_key(func.__name__, args, kwargs, key_prefix)
            
            # 캐시에서 확인
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                print(f"🟢 Cache HIT: {cache_key}")
                return cached_result
            
            print(f"🔴 Cache MISS: {cache_key}")
            
            # 캐시에 없으면 함수 실행
            result = func(*args, **kwargs)
            
            # 결과 캐싱
            cache.set(cache_key, result, ttl)
            print(f"💾 Cached: {cache_key} (TTL: {ttl}s)")
            
            return result
        return wrapper
    return decorator

def _generate_cache_key(func_name: str, args: tuple, kwargs: dict, prefix: str = "") -> str:
    """캐시 키 생성"""
    # 함수 이름과 매개변수를 기반으로 고유한 키 생성
    key_data = {
        'function': func_name,
        'args': str(args),
        'kwargs': sorted(kwargs.items()) if kwargs else []
    }
    
    key_string = json.dumps(key_data, sort_keys=True)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    
    return f"{prefix}:{func_name}:{key_hash}" if prefix else f"{func_name}:{key_hash}"

# 캐시 통계를 위한 함수들
def get_cache_stats() -> Dict[str, Any]:
    """캐시 통계 반환"""
    total_entries = len(cache._cache)
    cache.cleanup_expired()
    active_entries = len(cache._cache)
    expired_entries = total_entries - active_entries
    
    return {
        'total_entries': total_entries,
        'active_entries': active_entries,
        'expired_entries': expired_entries,
        'memory_usage_mb': _estimate_memory_usage()
    }

def _estimate_memory_usage() -> float:
    """캐시 메모리 사용량 추정 (MB)"""
    import sys
    total_size = 0
    for entry in cache._cache.values():
        total_size += sys.getsizeof(entry)
    return total_size / (1024 * 1024)  # MB로 변환
