'use client';

import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import RebelsRanking from "@/components/dashboard/rebels-ranking"
import SecurityStatus from "@/components/dashboard/security-status"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import { useDashboardStats } from "@/hooks/use-api-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginPrompt } from "@/components/auth/login-prompt"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"

const mockData = mockDataJson as MockData

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const [currentTime, setCurrentTime] = useState<string>('');
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Hydration 오류 방지: 클라이언트에서만 시간 업데이트
  useEffect(() => {
    setIsMounted(true);
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    
    updateTime(); // 초기 시간 설정
    const interval = setInterval(updateTime, 60000); // 1분마다 업데이트
    
    return () => clearInterval(interval);
  }, []);

  // API 연결 상태 확인
  const useApiData = !statsLoading && statsData && !statsError;
  
  // displayStats가 배열인지 확인하고 fallback 적용
  let displayStats;
  if (useApiData && Array.isArray(statsData)) {
    displayStats = statsData;
  } else {
    displayStats = mockData.dashboardStats;
  }

  // 시간 표시 (Hydration 오류 방지)
  const timeDisplay = isMounted ? `Last updated ${currentTime}` : 'Last updated';
  const statusDisplay = useApiData ? '🟢 API Connected' : '🔴 Using Mock Data';

  return (
    <DashboardPageLayout
      header={{
        title: "CVE Security Center",
        description: `${timeDisplay} ${statusDisplay}`,
        icon: BracketsIcon,
      }}
    >
      {statsError && (
        <Alert className="mb-6">
          <AlertDescription>
            API 연결에 실패했습니다. Mock 데이터를 사용합니다: {statsError.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {statsLoading ? (
          // 로딩 스켈레톤
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))
        ) : (
          displayStats.map((stat, index) => (
            <DashboardStat
              key={index}
              label={stat.label}
              value={stat.value}
              description={stat.description}
              icon={iconMap[stat.icon as keyof typeof iconMap]}
              tag={stat.tag}
              intent={stat.intent}
              direction={stat.direction}
            />
          ))
        )}
      </div>

      <div className="mb-6">
        <DashboardChart useApiData={useApiData} />
      </div>

      {/* Main 2-column grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RebelsRanking rebels={mockData.rebelsRanking} />
        <SecurityStatus statuses={mockData.securityStatus} />
      </div>
    </DashboardPageLayout>
  )
}
