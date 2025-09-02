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
import { useDashboardStats, useHealthCheck } from "@/hooks/use-api"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

const mockData = mockDataJson as MockData

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  const { data: statsData, loading: statsLoading, error: statsError } = useDashboardStats();
  const { isHealthy, loading: healthLoading } = useHealthCheck();

  // API 연결 상태 확인
  const useApiData = !healthLoading && isHealthy && !statsError;
  const displayStats = useApiData && statsData ? statsData : mockData.dashboardStats;

  return (
    <DashboardPageLayout
      header={{
        title: "CVE Security Center",
        description: `Last updated ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ${!healthLoading && isHealthy ? '🟢 API Connected' : '🔴 Using Mock Data'}`,
        icon: BracketsIcon,
      }}
    >
      {statsError && (
        <Alert className="mb-6">
          <AlertDescription>
            API 연결에 실패했습니다. Mock 데이터를 사용합니다: {statsError}
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
