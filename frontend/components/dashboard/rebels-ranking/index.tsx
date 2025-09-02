import { Badge } from "@/components/ui/badge"
import DashboardCard from "@/components/dashboard/card"
import type { RebelRanking } from "@/types/dashboard"
import { cn } from "@/lib/utils"

interface RebelsRankingProps {
  rebels: RebelRanking[]
}

export default function RebelsRanking({ rebels }: RebelsRankingProps) {
  const getSeverityVariant = (points: number) => {
    if (points >= 9.0) return "destructive"
    if (points >= 7.0) return "warning"
    if (points >= 4.0) return "secondary"
    return "outline"
  }

  const getSeverityColor = (points: number) => {
    if (points >= 9.0) return "bg-destructive text-destructive-foreground"
    if (points >= 7.0) return "bg-warning text-warning-foreground"
    return "bg-secondary text-secondary-foreground"
  }

  return (
    <DashboardCard
      title="PRIORITY CVE LIST"
      intent="default"
      addon={<Badge variant="outline-destructive">3 CRITICAL</Badge>}
    >
      <div className="space-y-4">
        {rebels.map((rebel) => (
          <div key={rebel.id} className="flex items-center justify-between">
            <div className="flex items-center gap-1 w-full">
              <div
                className={cn(
                  "flex items-center justify-center rounded text-sm font-bold px-1.5 mr-1 md:mr-2",
                  rebel.featured ? `h-10 ${getSeverityColor(rebel.points)}` : `h-8 ${getSeverityColor(rebel.points)}`,
                )}
              >
                {rebel.id}
              </div>
              <div
                className={cn(
                  "flex flex-1 h-full items-center justify-between py-2 px-2.5 rounded",
                  rebel.featured && "bg-accent",
                )}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn("font-display", rebel.featured ? "text-xl md:text-2xl" : "text-lg md:text-xl")}
                      >
                        {rebel.name}
                      </span>
                      <span className="text-muted-foreground text-xs md:text-sm">{rebel.handle}</span>
                    </div>
                    <Badge variant={getSeverityVariant(rebel.points)}>CVSS {rebel.points}</Badge>
                  </div>
                  {rebel.subtitle && <span className="text-sm text-muted-foreground italic">{rebel.subtitle}</span>}
                  {rebel.streak && !rebel.featured && (
                    <span className="text-sm text-muted-foreground italic">{rebel.streak}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}
