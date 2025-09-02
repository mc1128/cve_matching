/**
 * Custom Hooks for CVE Data Management
 * API 데이터를 관리하는 React 커스텀 훅들
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, type CVEStats, type ChartDataPoint, type Device, type CVEDetail, type DeviceCVE, type AssetComponent } from '@/lib/api-client';

// 공통 상태 타입
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// 자산 구성요소 훅
export function useAssetComponents(assetId: number | null): AsyncState<AssetComponent[]> {
  const [data, setData] = useState<AssetComponent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (assetId === null) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAssetComponents(assetId);
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch asset components');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 대시보드 통계 훅
export function useDashboardStats(): AsyncState<CVEStats[]> {
  const [data, setData] = useState<CVEStats[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDashboardStats();
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch dashboard stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 차트 데이터 훅

// 차트 데이터 훅
export function useChartData(period: 'week' | 'month' | 'year' = 'week'): AsyncState<ChartDataPoint[]> {
  const [data, setData] = useState<ChartDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getChartData(period);
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch chart data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 디바이스 목록 훅
export function useDevices(): AsyncState<Device[]> {
  const [data, setData] = useState<Device[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDevices();
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch devices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 최근 CVE 훅
export function useRecentCVEs(limit: number = 10): AsyncState<CVEDetail[]> {
  const [data, setData] = useState<CVEDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getRecentCVEs(limit);
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch recent CVEs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// CVE 상세 정보 훅
export function useCVEDetail(cveId: string | null): AsyncState<CVEDetail> {
  const [data, setData] = useState<CVEDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!cveId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.getCVEDetail(cveId);
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch CVE detail');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cveId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 디바이스별 CVE 훅
export function useDeviceCVEs(deviceId: number | null): AsyncState<DeviceCVE[]> {
  const [data, setData] = useState<DeviceCVE[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (deviceId === null) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDeviceCVEs(deviceId);
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch device CVEs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 디바이스 스캔 훅 (액션 훅)
export function useDeviceScan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanDevice = useCallback(async (deviceId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.scanDevice(deviceId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Failed to trigger scan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scanDevice,
    loading,
    error,
  };
}

// 트렌드 데이터 훅
export function useTrends(days: number = 30): AsyncState<any[]> {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getTrends(days);
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch trends');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 헬스 체크 훅
export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.healthCheck();
        setIsHealthy(response.status === 'healthy');
      } catch (err) {
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    
    // 30초마다 헬스 체크
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, loading };
}
