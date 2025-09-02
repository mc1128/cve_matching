'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분간 캐시 유지
            staleTime: 5 * 60 * 1000, // 5 minutes
            // 백그라운드에서 자동 갱신 비활성화 (성능 최적화)
            refetchOnWindowFocus: false,
            // 컴포넌트 마운트 시 자동 갱신 비활성화
            refetchOnMount: false,
            // 재연결 시 자동 갱신 비활성화
            refetchOnReconnect: false,
            // 30분간 캐시 보관
            gcTime: 30 * 60 * 1000, // 30 minutes (이전 cacheTime)
            // 재시도 설정
            retry: (failureCount, error) => {
              // 네트워크 에러나 5xx 에러는 최대 2번 재시도
              if (failureCount < 2) return true;
              return false;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
