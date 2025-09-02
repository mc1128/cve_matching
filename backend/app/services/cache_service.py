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
                return cached_result
            
            # 캐시에 없으면 함수 실행
            result = func(*args, **kwargs)
            
            # 결과 캐싱
            cache.set(cache_key, result, ttl)
            
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
