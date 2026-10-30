"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type PunchStatusBadgeProps = {
  status: string
  variant?: "connection" | "sync" | "log" | "import"
  className?: string
}

function connectionClass(status: string): string {
  const n = status.toLowerCase()
  if (n.includes("connect") && !n.includes("dis"))
    return "bg-emerald-100 text-emerald-800 border-emerald-200"
  if (n.includes("disconnect")) return "bg-red-100 text-red-800 border-red-200"
  return "bg-muted text-muted-foreground"
}

function resultClass(status: string): string {
  const n = status.toLowerCase()
  if (n === "success" || n === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-200"
  if (n === "failed") return "bg-red-100 text-red-800 border-red-200"
  if (n === "processing" || n === "pending") return "bg-amber-100 text-amber-800 border-amber-200"
  return "bg-muted text-muted-foreground"
}

export function PunchStatusBadge({ status, variant = "log", className }: PunchStatusBadgeProps) {
  const style =
    variant === "connection" ? connectionClass(status) : resultClass(status)

  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase", style, className)}>
      {status || "Unknown"}
    </Badge>
  )
}
