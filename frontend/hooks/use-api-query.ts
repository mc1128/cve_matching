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

// 디바이스 목록 조회 (캐싱 적용)
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
    // 5분간 데이터를 fresh하게 유지
    staleTime: 5 * 60 * 1000,
    // 30분간 캐시 보관
    gcTime: 30 * 60 * 1000,
  });
}

// 자산 구성요소 조회 (캐싱 적용)
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
    // 자산 구성요소는 변경이 적으므로 더 오래 캐시
    staleTime: 15 * 60 * 1000, // 15분으로 증가
    gcTime: 2 * 60 * 60 * 1000, // 2시간으로 증가
    // 백그라운드에서 리패치하지 않음 (더 빠른 응답)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // 캐시된 데이터가 있으면 즉시 반환
    placeholderData: (previousData) => previousData,
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
    queryClient.invalidateQueries({ queryKey: queryKeys.assetComponents(assetId) });
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
