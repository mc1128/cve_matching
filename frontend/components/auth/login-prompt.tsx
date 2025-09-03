"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, LogIn, UserPlus } from "lucide-react"

export function LoginPrompt() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">로그인이 필요합니다</CardTitle>
          </div>
          <CardDescription>
            모든 기능을 사용하려면 로그인해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/auth/login" className="w-full">
            <Button className="w-full" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              로그인
            </Button>
          </Link>
          <Link href="/auth/register" className="w-full">
            <Button variant="outline" className="w-full" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              회원가입
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
