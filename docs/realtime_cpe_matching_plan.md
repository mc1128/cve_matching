# 실시간 CPE 매칭 업데이트 구현 계획

## 1. 백엔드 캐시 무효화 시스템

### 현재 상황
```python
# backend/app/services/cache_service.py
# 이미 캐시 데코레이터 구현되어 있음
@cache_result(ttl=600, key_prefix="asset_components")
def get_asset_components(self, asset_id: int):
    # 컴포넌트 조회
```

### 개선: 스마트 캐시 무효화
```python
# backend/app/services/cache_service.py 개선
class SmartCache:
    def __init__(self):
        self.cache_store = {}
        self.cache_timestamps = {}
        self.dependency_map = {}  # 캐시 의존성 맵
    
    def invalidate_related_cache(self, component_id: int):
        """CPE 매칭 시 관련 캐시 무효화"""
        # 1. 해당 컴포넌트의 자산 ID 찾기
        asset_id = self.get_asset_id_by_component(component_id)
        
        # 2. 관련 캐시 키들 무효화
        cache_keys_to_remove = [
            f"asset_components:{asset_id}",
            f"devices:all",
            f"dashboard:stats"
        ]
        
        for key in cache_keys_to_remove:
            self.cache_store.pop(key, None)
            self.cache_timestamps.pop(key, None)
        
        logger.info(f"🔄 캐시 무효화 완료: {cache_keys_to_remove}")

# 캐시 서비스 인스턴스
smart_cache = SmartCache()
```

## 2. CPE 매칭 API 개선

### 현재 API 개선
```python
# backend/app/api/cpe_endpoints.py
@router.post("/components/{component_id}/cpe-match")
async def trigger_cpe_matching(component_id: int, db_service: DatabaseService = Depends(get_db_service)):
    try:
        # ... 기존 CPE 매칭 로직 ...
        
        if matching_result["success"]:
            # DB 업데이트
            update_query = """
                UPDATE asset_components 
                SET cpe_full_string = %s, updated_at = NOW()
                WHERE component_id = %s
            """
            db_service.execute_query(update_query, (cpe_string, component_id))
            
            # 🔥 새로 추가: 관련 캐시 즉시 무효화
            smart_cache.invalidate_related_cache(component_id)
            
            # 🔥 새로 추가: 업데이트된 컴포넌트 정보 즉시 반환
            updated_component = db_service.get_component_by_id(component_id)
            
            return {
                "success": True,
                "message": "CPE matching completed and cache updated",
                "component_id": component_id,
                "cpe_string": cpe_string,
                "updated_component": updated_component,  # 최신 데이터
                "cache_invalidated": True,
                "timestamp": datetime.now().isoformat()
            }
```

## 3. 프론트엔드 실시간 업데이트

### React Query 캐시 무효화
```typescript
// frontend/hooks/use-api-query.ts 개선
export function useAssetComponents(assetId: number | null) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.assetComponents(assetId!),
    queryFn: async () => {
      if (assetId === null) return [];
      
      const response = await api.getAssetComponents(assetId);
      if (!response.success) {
        throw new Error('Failed to fetch asset components');
      }
      return response.data;
    },
    enabled: assetId !== null,
    staleTime: 5 * 60 * 1000,    // 5분
    gcTime: 15 * 60 * 1000,      // 15분
  });
}

// CPE 매칭 후 캐시 갱신을 위한 훅
export function useCPEMatching() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (componentId: number) => {
      return await api.triggerCPEMatching(componentId);
    },
    onSuccess: (data, componentId) => {
      // 🔥 성공 시 관련 쿼리 즉시 무효화
      
      // 1. 해당 자산의 컴포넌트 캐시 무효화
      const assetId = data.asset_id || getAssetIdFromComponent(componentId);
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assetComponents(assetId) 
      });
      
      // 2. 디바이스 목록 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.devices 
      });
      
      // 3. 대시보드 통계 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardStats 
      });
      
      // 4. 🎯 optimistic update (즉시 UI 반영)
      if (data.updated_component) {
        queryClient.setQueryData(
          queryKeys.assetComponents(assetId),
          (oldData: any[]) => {
            return oldData?.map(comp => 
              comp.component_id === componentId 
                ? { ...comp, ...data.updated_component }
                : comp
            ) || [];
          }
        );
      }
      
      console.log('🎉 CPE 매칭 완료 - UI 즉시 업데이트');
    },
    onError: (error) => {
      console.error('❌ CPE 매칭 실패:', error);
    }
  });
}
```

### 컴포넌트에서 실시간 업데이트 적용
```tsx
// frontend/app/devices/page.tsx 개선
function AssetComponents({ assetId, setCpeModalData, setCpeModalOpen }) {
  const { data: components, isLoading, error, refetch } = useAssetComponents(assetId);
  const cpeMatchingMutation = useCPEMatching();  // 새로 추가
  
  const handleCPEMatching = async (componentId: number) => {
    try {
      // 🔥 Mutation 사용으로 자동 캐시 업데이트
      const result = await cpeMatchingMutation.mutateAsync(componentId);
      
      // UI 즉시 업데이트 (optimistic update로 이미 반영됨)
      if (result.success) {
        // 성공 메시지 표시
        toast.success(`✅ CPE 매칭 완료: ${result.cpe_string}`);
      }
      
    } catch (error) {
      console.error('CPE 매칭 실패:', error);
      toast.error('❌ CPE 매칭 실패');
    }
  };

  return (
    <div className="space-y-3">
      {components?.map((component) => (
        <div key={component.component_id} className="component-card">
          <div className="cpe-status">
            {component.cpe_full_string ? (
              <Badge variant="success">
                ✅ CPE: {component.cpe_full_string}
              </Badge>
            ) : (
              <Button 
                onClick={() => handleCPEMatching(component.component_id)}
                disabled={cpeMatchingMutation.isPending}
                size="sm"
              >
                {cpeMatchingMutation.isPending ? (
                  <>🔄 매칭 중...</>
                ) : (
                  <>🎯 CPE 매칭</>
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 4. 실시간 프로그레스 표시 (선택사항)

### WebSocket 또는 Server-Sent Events 대신 Polling 활용
```typescript
// 긴 처리 시간의 CPE 매칭을 위한 폴링
export function useCPEMatchingWithProgress() {
  const [progress, setProgress] = useState(0);
  const [isMatching, setIsMatching] = useState(false);
  
  const startCPEMatching = async (componentId: number) => {
    setIsMatching(true);
    setProgress(0);
    
    try {
      // 1. CPE 매칭 시작
      const matchingPromise = api.triggerCPEMatching(componentId);
      
      // 2. 프로그레스 시뮬레이션 (실제로는 백엔드에서 진행률 제공)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      // 3. 매칭 완료 대기
      const result = await matchingPromise;
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // 4. 캐시 업데이트는 React Query Mutation이 자동 처리
      
      return result;
      
    } finally {
      setTimeout(() => {
        setIsMatching(false);
        setProgress(0);
      }, 1000);
    }
  };
  
  return {
    startCPEMatching,
    progress,
    isMatching
  };
}
```

## 5. 성능 최적화 고려사항

### 백엔드 최적화
```python
# 비동기 처리로 응답 속도 향상
@router.post("/components/{component_id}/cpe-match")
async def trigger_cpe_matching_async(component_id: int, background_tasks: BackgroundTasks):
    # 즉시 응답 반환
    background_tasks.add_task(process_cpe_matching, component_id)
    
    return {
        "success": True,
        "message": "CPE matching started",
        "component_id": component_id,
        "status": "processing"
    }

async def process_cpe_matching(component_id: int):
    """백그라운드에서 CPE 매칭 처리"""
    # ... CPE 매칭 로직 ...
    # 완료 후 캐시 무효화
    smart_cache.invalidate_related_cache(component_id)
```

### 프론트엔드 최적화
```typescript
// Optimistic Updates로 즉시 UI 반영
const optimisticUpdate = (componentId: number, cpeString: string) => {
  queryClient.setQueryData(
    queryKeys.assetComponents(assetId),
    (oldData: any[]) => {
      return oldData?.map(comp => 
        comp.component_id === componentId 
          ? { ...comp, cpe_full_string: cpeString, status: 'matched' }
          : comp
      ) || [];
    }
  );
};
```

## 6. 에러 처리 및 롤백

### 실패 시 UI 롤백
```typescript
const handleCPEMatchingWithRollback = async (componentId: number) => {
  // 1. Optimistic update
  const previousData = queryClient.getQueryData(queryKeys.assetComponents(assetId));
  optimisticUpdate(componentId, "매칭 중...");
  
  try {
    const result = await api.triggerCPEMatching(componentId);
    // 성공 시 실제 데이터로 업데이트
    optimisticUpdate(componentId, result.cpe_string);
    
  } catch (error) {
    // 실패 시 이전 상태로 롤백
    queryClient.setQueryData(queryKeys.assetComponents(assetId), previousData);
    toast.error('CPE 매칭 실패 - 다시 시도해주세요');
  }
};
```

이렇게 구현하면:
- ✅ **무료 캐싱 최적화** + **실시간 CPE 업데이트** 동시 구현
- ✅ **DB 호출 감소** + **즉시 UI 반영**
- ✅ **사용자 경험 향상** (로딩 없는 실시간 업데이트)
- ✅ **에러 처리** 및 **롤백 메커니즘**

비용 추가 없이도 충분히 강력한 실시간 업데이트 시스템을 구축할 수 있습니다!
