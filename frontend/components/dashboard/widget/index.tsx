"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TVNoise from "@/components/ui/tv-noise"
import type { WidgetData } from "@/types/dashboard"

interface WidgetProps {
  widgetData: WidgetData
}

export default function Widget({ widgetData }: WidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString("ko-KR", {
      weekday: "long",
    })
    const restOfDate = date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    return { dayOfWeek, restOfDate }
  }

  const dateInfo = formatDate(currentTime)

  return (
    <Card className="w-full aspect-[2] relative overflow-hidden">
      <TVNoise opacity={0.3} intensity={0.2} speed={40} />
      <CardContent className="bg-accent/30 flex-1 flex flex-col justify-between text-sm font-medium uppercase relative z-20">
        <div className="flex justify-between items-center">
          <span className="opacity-50">{dateInfo.dayOfWeek}</span>
          <span>{dateInfo.restOfDate}</span>
        </div>
        <div className="text-center">
          <div className="text-5xl font-display" suppressHydrationWarning>
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="opacity-50">{widgetData.temperature}</span>
          <span>{widgetData.location}</span>

          <Badge variant="secondary" className="bg-accent">
            {widgetData.timezone}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
