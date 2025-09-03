'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Device, type AssetComponent, type CVEStats, type ChartDataPoint } from '@/lib/api-client';

// 쿼리 키 상수 정의
export const queryKeys = {
  devices: ['devices'] as const,
  assetComponents: (assetId: number) => ['assetComponents', assetId] as const,
  dashboardStats: ['dashboardStats'] as const,
  chartData: (period: string) => ['chartData', period] as const,
} as const;

// 디바이스 목록 조회 (캐싱 최적화 적용)
export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: async () => {
      const response = await api.getDevices();
      if (!response.success) {
        throw new Error('Failed to fetch devices');
      }
      return response.data;
    },
    // 캐싱 최적화: 15분간 fresh 상태 유지 (디바이스 목록은 자주 변경되지 않음)
    staleTime: 15 * 60 * 1000, // 15분
    gcTime: 60 * 60 * 1000, // 1시간 보관
    // 불필요한 리패치 최소화
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// 자산 구성요소 조회 (캐싱 최적화 적용)
export function useAssetComponents(assetId: number | null) {
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
    // assetId가 null이면 쿼리 비활성화
    enabled: assetId !== null,
    // 캐싱 최적화: 10분간 fresh 상태 유지
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분 보관
    // 불필요한 리패치 최소화
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // 캐시된 데이터 우선 표시 후 백그라운드 업데이트
    refetchOnMount: false,
  });
}

// 대시보드 통계 조회 (캐싱 적용)
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const response = await api.getDashboardStats();
      if (!response.success) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.data;
    },
    // 통계는 자주 변경되므로 짧은 캐시
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

// 차트 데이터 조회 (캐싱 적용)
export function useChartData(period: 'week' | 'month' | 'year' = 'week') {
  return useQuery({
    queryKey: queryKeys.chartData(period),
    queryFn: async () => {
      const response = await api.getChartData(period);
      if (!response.success) {
        throw new Error('Failed to fetch chart data');
      }
      return response.data;
    },
    // 차트 데이터는 중간 정도의 캐시
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 20 * 60 * 1000, // 20분
  });
}

// 수동 데이터 갱신을 위한 훅
export function useRefreshData() {
  const queryClient = useQueryClient();

  const refreshDevices = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.devices });
  };

  const refreshAssetComponents = (assetId: number) => {
    // 1. 기존 캐시 삭제
    queryClient.removeQueries({ queryKey: queryKeys.assetComponents(assetId) });
    
    // 2. 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: queryKeys.assetComponents(assetId) });
    
    // 3. 강제 refetch
    queryClient.refetchQueries({ queryKey: queryKeys.assetComponents(assetId) });
  };

  const refreshDashboardStats = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
  };

  const refreshChartData = (period?: string) => {
    if (period) {
      queryClient.invalidateQueries({ queryKey: queryKeys.chartData(period) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['chartData'] });
    }
  };

  const refreshAll = () => {
    queryClient.invalidateQueries();
  };

  return {
    refreshDevices,
    refreshAssetComponents,
    refreshDashboardStats,
    refreshChartData,
    refreshAll,
  };
}

// 백그라운드에서 데이터를 미리 가져오는 훅 (프리페칭)
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchAssetComponents = async (assetId: number) => {
    // 이미 캐시에 있는지 확인
    const existingData = queryClient.getQueryData(queryKeys.assetComponents(assetId));
    if (existingData) {
      return existingData; // 이미 있으면 네트워크 요청 하지 않음
    }

    await queryClient.prefetchQuery({
      queryKey: queryKeys.assetComponents(assetId),
      queryFn: async () => {
        const response = await api.getAssetComponents(assetId);
        if (!response.success) {
          throw new Error('Failed to prefetch asset components');
        }
        return response.data;
      },
      staleTime: 15 * 60 * 1000, // 15분
      gcTime: 2 * 60 * 60 * 1000, // 2시간
    });
  };

  // 여러 자산의 컴포넌트를 배치로 프리페칭
  const prefetchMultipleAssetComponents = async (assetIds: number[]) => {
    const uncachedAssetIds = assetIds.filter(assetId => 
      !queryClient.getQueryData(queryKeys.assetComponents(assetId))
    );

    if (uncachedAssetIds.length === 0) return;

    // 동시에 최대 3개까지만 프리페칭 (네트워크 부하 고려)
    const chunks = [];
    for (let i = 0; i < uncachedAssetIds.length; i += 3) {
      chunks.push(uncachedAssetIds.slice(i, i + 3));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(assetId => prefetchAssetComponents(assetId))
      );
    }
  };

  return {
    prefetchAssetComponents,
    prefetchMultipleAssetComponents,
  };
}

// CPE 매칭을 위한 Mutation 훅 (실시간 업데이트)
export function useCPEMatching() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (componentId: number) => {
      const response = await api.triggerCPEMatching(componentId);
      if (!response.success) {
        throw new Error(response.message || 'CPE matching failed');
      }
      return response;
    },
    
    // 🔥 Optimistic Update: 즉시 UI에 로딩 상태 표시
    onMutate: async (componentId: number) => {
      // 모든 관련 asset의 컴포넌트 쿼리를 찾아서 업데이트
      const queryCache = queryClient.getQueryCache();
      const assetComponentQueries = queryCache.findAll({
        predicate: (query) => {
          return query.queryKey[0] === 'assetComponents';
        }
      });
      
      const previousDataMap = new Map();
      
      // 각 쿼리에서 해당 컴포넌트를 찾아 로딩 상태로 업데이트
      for (const query of assetComponentQueries) {
        const assetId = query.queryKey[1] as number;
        const previousData = queryClient.getQueryData(queryKeys.assetComponents(assetId));
        
        if (previousData) {
          previousDataMap.set(assetId, previousData);
          
          queryClient.setQueryData(
            queryKeys.assetComponents(assetId),
            (oldData: any[]) => {
              return oldData?.map(comp => 
                comp.component_id === componentId 
                  ? { 
                      ...comp, 
                      cpe_matching_in_progress: true,
                      cpe_matching_status: 'matching...'
                    }
                  : comp
              ) || [];
            }
          );
        }
      }
      
      return { previousDataMap };
    },
    
    // 🎯 성공 시 실제 데이터로 업데이트
    onSuccess: (data, componentId, context) => {
      const queryCache = queryClient.getQueryCache();
      const assetComponentQueries = queryCache.findAll({
        predicate: (query) => {
          return query.queryKey[0] === 'assetComponents';
        }
      });
      
      // 성공한 컴포넌트 정보로 업데이트
      for (const query of assetComponentQueries) {
        const assetId = query.queryKey[1] as number;
        
        queryClient.setQueryData(
          queryKeys.assetComponents(assetId),
          (oldData: any[]) => {
            return oldData?.map(comp => 
              comp.component_id === componentId 
                ? { 
                    ...comp, 
                    cpe_full_string: data.cpe_string,
                    cpe_matching_in_progress: false,
                    cpe_matching_status: 'completed',
                    updated_at: data.timestamp,
                    // CPE 매칭 메타데이터 추가
                    cpe_matching_method: data.method,
                    cpe_confidence_score: data.confidence_score
                  }
                : comp
            ) || [];
          }
        );
      }
      
      // 관련 캐시들도 무효화 (백그라운드에서 최신 데이터 가져오기)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.devices,
        refetchType: 'none' // 즉시 리패치하지 않고 다음 접근시에만
      });
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardStats,
        refetchType: 'none'
      });
    },
    
    // ❌ 실패 시 이전 상태로 롤백
    onError: (error, componentId, context) => {
      if (context?.previousDataMap) {
        // 이전 데이터로 롤백
        for (const [assetId, previousData] of context.previousDataMap) {
          queryClient.setQueryData(queryKeys.assetComponents(assetId), previousData);
        }
      }
    },
    
    // 완료 후 정리
    onSettled: (data, error, componentId) => {
      // 로딩 상태 정리 (실패한 경우에도)
      if (error) {
        const queryCache = queryClient.getQueryCache();
        const assetComponentQueries = queryCache.findAll({
          predicate: (query) => {
            return query.queryKey[0] === 'assetComponents';
          }
        });
        
        for (const query of assetComponentQueries) {
          const assetId = query.queryKey[1] as number;
          
          queryClient.setQueryData(
            queryKeys.assetComponents(assetId),
            (oldData: any[]) => {
              return oldData?.map(comp => 
                comp.component_id === componentId 
                  ? { 
                      ...comp, 
                      cpe_matching_in_progress: false,
                      cpe_matching_status: 'failed'
                    }
                  : comp
              ) || [];
            }
          );
        }
      }
    }
  });
}
