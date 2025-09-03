"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugOtp, setDebugOtp] = useState("")
  
  const { sendOTP, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await sendOTP({ email })
      setDebugOtp(response.debug_otp || "")
      setStep("otp")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login({ email, otp })
      router.push(redirectTo) // 리다이렉트 URL로 이동
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (value: string) => {
    setOtp(value)
    // OTP 6자리 입력 자동 검증 제거 - 사용자가 버튼을 클릭하거나 Enter를 눌러야 함
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "email" ? "로그인" : "OTP 인증"}
          </CardTitle>
          <CardDescription>
            {step === "email" 
              ? "이메일 주소를 입력하면 OTP를 발송해드립니다" 
              : `${email}로 발송된 6자리 OTP를 입력하세요`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 주소</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    OTP 발송 중...
                  </>
                ) : (
                  "OTP 발송"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">인증번호 (6자리)</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && otp.length === 6) {
                        handleVerifyOTP(e as any)
                      }
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {debugOtp && (
                  <p className="text-sm text-muted-foreground text-center">
                    개발환경 OTP: <code className="font-mono">{debugOtp}</code>
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      인증 중...
                    </>
                  ) : (
                    "로그인"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep("email")
                    setOtp("")
                    setError("")
                  }}
                >
                  이메일 다시 입력
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
