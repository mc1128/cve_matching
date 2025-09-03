"use client"

import type * as React from "react"
import { useState } from "react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import BracketsIcon from "@/components/icons/brackets"
import ProcessorIcon from "@/components/icons/proccesor"
import CuteRobotIcon from "@/components/icons/cute-robot"
import GearIcon from "@/components/icons/gear"
import MonkeyIcon from "@/components/icons/monkey"
import DotsVerticalIcon from "@/components/icons/dots-vertical"
import { Bullet } from "@/components/ui/bullet"
import LockIcon from "@/components/icons/lock"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { LogOut, User, Shield } from "lucide-react"
import { useIsV0 } from "@/lib/v0-context"
import { useState } from "react"

// This is sample data for the sidebar
const data = {
  navMain: [
    {
      title: "Tools",
      items: [
        {
          title: "Overview",
          url: "/",
          icon: BracketsIcon,
          isActive: true,
        },
        {
          title: "Devices",
          url: "/devices",
          icon: ProcessorIcon,
          isActive: false,
        },
        {
          title: "CVE Management",
          url: "/security",
          icon: CuteRobotIcon,
          isActive: false,
        },
        {
          title: "Admin Settings",
          url: "/admin",
          icon: GearIcon,
          isActive: false,
          locked: true,
        },
      ],
    },
  ],
  desktop: {
    title: "Desktop (Online)",
    status: "online",
  },
  user: {
    name: "KRIMSON",
    email: "krimson@joyco.studio",
    avatar: "/avatars/user_krimson.png",
  },
}

export function DashboardSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const isV0 = useIsV0()
  const { user, isAuthenticated, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    if (confirm("정말 로그아웃하시겠습니까?")) {
      setIsLoggingOut(true)
      try {
        await logout()
      } catch (error) {
        console.error("Logout error:", error)
        alert("로그아웃 중 오류가 발생했습니다.")
      } finally {
        setIsLoggingOut(false)
        setIsPopoverOpen(false) // 로그아웃 후 팝오버 닫기
      }
    }
  }

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg flex gap-3 flex-row rounded-b-none">
        <div className="flex overflow-clip size-12 shrink-0 items-center justify-center rounded bg-sidebar-primary-foreground/10 transition-colors group-hover:bg-sidebar-primary text-sidebar-primary-foreground">
          <MonkeyIcon className="size-10 group-hover:scale-[1.7] origin-top-left transition-transform" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="text-2xl font-display">M.O.N.K.Y.</span>
          <span className="text-xs uppercase">The OS for Rebels</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.map((group, i) => (
          <SidebarGroup className={cn(i === 0 && "rounded-t-none")} key={group.title}>
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(item.locked && "pointer-events-none opacity-50")}
                    data-disabled={item.locked}
                  >
                    <SidebarMenuButton
                      asChild={!item.locked}
                      isActive={item.isActive}
                      disabled={item.locked}
                      className={cn("disabled:cursor-not-allowed", item.locked && "pointer-events-none")}
                    >
                      {item.locked ? (
                        <div className="flex items-center gap-3 w-full">
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <Link href={item.url}>
                          <div className="flex items-center gap-3 w-full">
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </div>
                        </Link>
                      )}
                    </SidebarMenuButton>
                    {item.locked && (
                      <SidebarMenuBadge>
                        <LockIcon className="size-5 block" />
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            User
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {isAuthenticated && user ? (
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
                      <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-clip">
                        <User className="h-8 w-8" />
                      </div>
                      <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate text-xl font-display">{user.user_name}</span>
                          <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100">
                            {user.email}
                          </span>
                        </div>
                        <DotsVerticalIcon className="ml-auto size-4" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 popover-content" side="bottom" align="end" sideOffset={4}>
                      <div className="flex flex-col">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-medium">{user.user_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.department && (
                            <p className="text-xs text-muted-foreground">{user.department}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start px-4 py-2 h-auto rounded-none"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleLogout()
                          }}
                          disabled={isLoggingOut}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex gap-0.5 w-full">
                    <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-clip">
                      <Shield className="h-8 w-8" />
                    </div>
                    <div className="pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent items-center rounded">
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate text-xl font-display">Guest</span>
                        <span className="truncate text-xs uppercase opacity-50">
                          Not logged in
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
