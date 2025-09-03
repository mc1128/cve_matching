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
import OverlayChat from "@/components/chat/overlay-chat"
import { CVEProvider } from "@/lib/cve-context"
import CVEDetail from "@/components/dashboard/cve-detail"
import { AssetProvider } from "@/lib/asset-context"
import { AuthProvider } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { AnimatedSidebar } from "@/components/dashboard/sidebar/animated-sidebar"
import QueryProvider from "@/providers/query-provider"

const mockData = mockDataJson as MockData
const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false

function RightSidebar({ mockData }: { mockData: MockData }) {
  const pathname = usePathname()
  const isCVEManagementPage = pathname === "/security"
  const isDevicesPage = pathname === "/devices"
  
  // Devices 페이지와 Security 페이지에서는 Widget과 Notifications 숨김
  const shouldHideWidgets = isCVEManagementPage || isDevicesPage

  return (
    <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
      {!shouldHideWidgets && <Widget widgetData={mockData.widgetData} />}

      {!shouldHideWidgets && <Notifications initialNotifications={mockData.notifications} />}

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
  
  // 완전 전체화면: Security 페이지만 (CVEDetail 때문에)
  const isFullScreenPage = isCVEManagementPage
  
  // 사이드바를 표시할 페이지: 메인 페이지와 Devices 페이지 (Security 제외)
  const shouldShowSidebar = !isCVEManagementPage
  
  // Widget과 Notifications가 숨겨진 페이지에서는 더 넓은 레이아웃 사용
  const shouldUseWideLayout = isDevicesPage

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <QueryProvider>
      <V0Provider isV0={isV0}>
        <AuthProvider>
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
                    <div className={`min-h-screen ${shouldShowSidebar ? "lg:pr-4" : ""}`}>
                      <div
                        className={`grid grid-cols-1 ${
                          !shouldShowSidebar 
                            ? "lg:grid-cols-1" 
                            : shouldUseWideLayout 
                              ? "lg:grid-cols-1" 
                              : "lg:grid-cols-4"
                        } ${shouldShowSidebar ? "gap-4" : ""}`}
                      >
                        <div className={
                          !shouldShowSidebar 
                            ? "col-span-1" 
                            : shouldUseWideLayout 
                              ? "col-span-1" 
                              : "col-span-3"
                        }>
                          {children}
                        </div>

                        {shouldShowSidebar && !shouldUseWideLayout && (
                          <div className="col-span-1 hidden lg:block">
                            <RightSidebar mockData={mockData} />
                          </div>
                        )}
                      </div>
                      
                      {/* Devices 페이지용 오버레이 채팅창 */}
                      {shouldUseWideLayout && (
                        <div className="fixed bottom-0 right-6 z-50 w-96 bg-background/95 backdrop-blur-sm rounded-t-xl shadow-2xl overflow-hidden">
                          <OverlayChat />
                        </div>
                      )}
                      
                      {/* Security 페이지용 오버레이 채팅창 */}
                      {isCVEManagementPage && (
                        <div className="fixed bottom-0 right-6 z-50 w-96 bg-background/95 backdrop-blur-sm rounded-t-xl shadow-2xl overflow-hidden">
                          <OverlayChat />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              {isCVEManagementPage && <CVEDetail />}

              <MobileChat />
            </SidebarProvider>
          </AssetProvider>
        </CVEProvider>
        </AuthProvider>
      </V0Provider>
    </QueryProvider>
  )
}
