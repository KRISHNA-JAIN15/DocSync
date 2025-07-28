"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  userCount: number
  error?: string | null
}

export function ConnectionStatus({ isConnected, userCount, error }: ConnectionStatusProps) {
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("connecting")

  useEffect(() => {
    if (error) {
      setStatus("error")
    } else if (isConnected) {
      setStatus("connected")
    } else {
      setStatus("disconnected")
    }
  }, [isConnected, error])

  const getStatusInfo = () => {
    switch (status) {
      case "connected":
        return {
          icon: <CheckCircle className="h-3 w-3 text-green-500" />,
          text: `Connected (${userCount} users)`,
          variant: "default" as const,
          className: "bg-green-50 text-green-700 border-green-200",
        }
      case "error":
        return {
          icon: <AlertTriangle className="h-3 w-3 text-red-500" />,
          text: "Connection Error",
          variant: "destructive" as const,
          className: "bg-red-50 text-red-700 border-red-200",
        }
      case "disconnected":
        return {
          icon: <WifiOff className="h-3 w-3 text-gray-500" />,
          text: "Disconnected",
          variant: "secondary" as const,
          className: "bg-gray-50 text-gray-700 border-gray-200",
        }
      default:
        return {
          icon: <Wifi className="h-3 w-3 text-blue-500 animate-pulse" />,
          text: "Connecting...",
          variant: "outline" as const,
          className: "bg-blue-50 text-blue-700 border-blue-200",
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Badge variant={statusInfo.variant} className={`flex items-center gap-1 ${statusInfo.className}`}>
      {statusInfo.icon}
      <span className="text-xs">{statusInfo.text}</span>
    </Badge>
  )
}
