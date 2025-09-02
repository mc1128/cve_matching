"use client"

import type React from "react"
import { useState } from "react"
import { V0Provider } from "@/lib/v0-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import Widget from "@/components/dashboard/widget"
import Notifications from "@/components/dashboard/notifications"
import { MobileChat } from "@/components/chat/mobile-chat"
import Chat from "@/components/chat"
import { CVEProvider } from "@/lib/cve-context"
import CVEDetail from "@/components/dashboard/cve-detail"
import { AssetProvider } from "@/lib/asset-context"
import { usePathname } from "next/navigation"
import { AnimatedSidebar } from "@/components/dashboard/sidebar/animated-sidebar"

const mockData = mockDataJson as MockData
const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false

function RightSidebar({ mockData }: { mockData: MockData }) {
  const pathname = usePathname()
  const isCVEManagementPage = pathname === "/security"

  return (
    <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
      {!isCVEManagementPage && <Widget widgetData={mockData.widgetData} />}

      {!isCVEManagementPage && <Notifications initialNotifications={mockData.notifications} />}

      <Chat />
    </div>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isDevicesPage = pathname === "/devices"
  const isCVEManagementPage = pathname === "/security"
  const isFullScreenPage = isDevicesPage || isCVEManagementPage

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <V0Provider isV0={isV0}>
      <CVEProvider>
        <AssetProvider>
          <SidebarProvider>
            <MobileHeader mockData={mockData} />

            <div className="relative min-h-screen bg-background">
              <div className="fixed left-0 top-0 h-full z-40 hidden lg:block">
                <AnimatedSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
              </div>

              <div
                className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-[213px]"}`}
              >
                <div className={`min-h-screen ${isFullScreenPage ? "" : "lg:pr-4"}`}>
                  <div
                    className={`grid grid-cols-1 ${isFullScreenPage ? "lg:grid-cols-1" : "lg:grid-cols-4"} ${isFullScreenPage ? "" : "gap-4"}`}
                  >
                    <div className={isFullScreenPage ? "col-span-1" : "col-span-3"}>{children}</div>

                    {!isFullScreenPage && (
                      <div className="col-span-1 hidden lg:block">
                        <RightSidebar mockData={mockData} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isCVEManagementPage && <CVEDetail />}

            <MobileChat />
          </SidebarProvider>
        </AssetProvider>
      </CVEProvider>
    </V0Provider>
  )
}
