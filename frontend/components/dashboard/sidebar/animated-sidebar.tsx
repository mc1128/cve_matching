"use client"

import { motion } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen, User, Shield, LogOut } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import BracketsIcon from "@/components/icons/brackets"
import ProcessorIcon from "@/components/icons/proccesor"
import CuteRobotIcon from "@/components/icons/cute-robot"
import GearIcon from "@/components/icons/gear"
import LockIcon from "@/components/icons/lock"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import DotsVerticalIcon from "@/components/icons/dots-vertical"
import { useAuth } from "@/lib/auth-context"

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
  user: {
    name: "KRIMSON",
    email: "krimson@joyco.studio",
    avatar: "/avatars/user_krimson.png",
  },
}

interface AnimatedSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export function AnimatedSidebar({ collapsed, setCollapsed }: AnimatedSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 팝오버가 열려있을 때는 외부 클릭으로 사이드바를 닫지 않음
      if (isPopoverOpen) return
      
      // 팝오버 컨텐츠 영역인지 확인 (data-radix-popper-content-wrapper 속성으로 판별)
      const target = event.target as Element
      const isPopoverContent = target.closest('[data-radix-popper-content-wrapper]') || 
                              target.closest('[role="dialog"]') ||
                              target.closest('.popover-content')
      
      if (isPopoverContent) return
      
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && !collapsed) {
        setCollapsed(true)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [collapsed, setCollapsed, isPopoverOpen])

  if (collapsed) {
    return (
      <motion.aside
        ref={sidebarRef}
        initial={{ width: 213 }}
        animate={{ width: 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="z-50 flex h-full shrink-0 flex-col border-r border-border bg-background"
      >
        <div className="flex items-center justify-center border-b border-border px-3 py-3 md:pb-4 lg:pt-7 lg:pb-4 min-h-[4rem] lg:min-h-[5.5rem]">
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-xl p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 pt-6">
          {data.navMain[0].items.map((item) => (
            <div key={item.title} className="relative">
              {item.locked ? (
                <div className="rounded-xl p-2.5 opacity-50 cursor-not-allowed" title={`${item.title} (Locked)`}>
                  <item.icon className="h-5 w-5" />
                </div>
              ) : (
                <Link
                  href={item.url}
                  className="rounded-xl p-2.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  title={item.title}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              )}
              {item.locked && <LockIcon className="absolute -top-1 -right-1 h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="mt-auto mb-6 flex justify-center">
          <div className="rounded-xl p-2">
            <div className="size-8 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {isAuthenticated && user ? (
                <User className="h-4 w-4" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    )
  }

  return (
    <motion.aside
      ref={sidebarRef}
      initial={{ width: 64 }}
      animate={{ width: 213 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="z-50 flex h-full shrink-0 flex-col border-r border-border bg-background"
      style={{ width: 213 }}
    >
      <div className="flex items-center justify-end border-b border-border px-4 py-3 md:pb-4 lg:pt-7 lg:pb-4 min-h-[4rem] lg:min-h-[5.5rem]">
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-xl p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-4">
          <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">TOOLS</div>
          <div className="space-y-1">
            {data.navMain[0].items.map((item) => (
              <div key={item.title} className="relative">
                {item.locked ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg opacity-50 cursor-not-allowed">
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                    <LockIcon className="ml-auto h-4 w-4" />
                  </div>
                ) : (
                  <Link
                    href={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors hover:bg-accent",
                      item.isActive && "bg-accent text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">USER</div>
        {isAuthenticated && user ? (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger className="flex gap-3 w-full group cursor-pointer rounded-lg p-2 hover:bg-accent transition-colors">
              <div className="shrink-0 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-clip border-2 border-border">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-foreground">{user.user_name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <DotsVerticalIcon className="ml-auto size-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0 popover-content" side="top" align="end" sideOffset={4}>
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
          <div className="flex gap-3 w-full rounded-lg p-2 bg-muted/50">
            <div className="shrink-0 flex size-10 items-center justify-center rounded-lg bg-muted border-2 border-border">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-foreground">Guest</div>
              <div className="text-xs text-muted-foreground">Not logged in</div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
