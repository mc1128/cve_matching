"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

// 퍼블릭 페이지 목록 (로그인 없이 접근 가능)
const PUBLIC_ROUTES = [
  "/", // 메인 페이지
  "/security", // CVE 리스트 페이지
  "/auth/login",
  "/auth/register",
]

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(route)
  })

  useEffect(() => {
    // 로딩 중이면 아무것도 하지 않음
    if (isLoading) return

    // 퍼블릭 라우트면 그대로 진행
    if (isPublicRoute) return

    // 인증이 필요한 페이지인데 로그인하지 않았으면 로그인 페이지로 이동
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
  }, [isAuthenticated, isLoading, isPublicRoute, pathname, router])

  // 로딩 중이면 로딩 스피너 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">로그인 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    )
  }

  // 인증이 필요한 페이지인데 로그인하지 않았으면 아무것도 렌더링하지 않음
  if (!isPublicRoute && !isAuthenticated) {
    return null
  }

  // 모든 조건을 만족하면 children 렌더링
  return <>{children}</>
}

// HOC 형태로도 제공
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
