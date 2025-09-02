"use client"

import type React from "react"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"
import { V0Provider } from "@/lib/v0-context"
import localFont from "next/font/local"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import Widget from "@/components/dashboard/widget"
import Notifications from "@/components/dashboard/notifications"
import { MobileChat } from "@/components/chat/mobile-chat"
import Chat from "@/components/chat"
import { CVEProvider } from "@/lib/cve-context"
import CVEDetail from "@/components/dashboard/cve-detail"
import { usePathname } from "next/navigation"

const mockData = mockDataJson as MockData

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

const rebelGrotesk = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
})

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false

function RightSidebar({ mockData }: { mockData: MockData }) {
  const pathname = usePathname()
  const isCVEManagementPage = pathname === "/security"

  return (
    <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
      {/* <CHANGE> Show CVE Detail only on CVE Management page */}
      {isCVEManagementPage ? <CVEDetail /> : <Widget widgetData={mockData.widgetData} />}

      {/* <CHANGE> Show notifications only on non-CVE pages */}
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
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preload" href="/fonts/Rebels-Fett.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased dark`}>
        <V0Provider isV0={isV0}>
          <CVEProvider>
            <SidebarProvider>
              {/* Mobile Header - only visible on mobile */}
              <MobileHeader mockData={mockData} />

              {/* Desktop Layout */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
                <div className="hidden lg:block col-span-2 top-0 relative">
                  <DashboardSidebar />
                </div>
                <div className="col-span-1 lg:col-span-7">{children}</div>
                <div className="col-span-3 hidden lg:block">
                  <RightSidebar mockData={mockData} />
                </div>
              </div>

              {/* Mobile Chat - floating CTA with drawer */}
              <MobileChat />
            </SidebarProvider>
          </CVEProvider>
        </V0Provider>
      </body>
    </html>
  )
}
