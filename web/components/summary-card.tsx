"use client"

import * as React from "react"
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react"
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface SummaryCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: {
    value: string
    label: string
    isUp: boolean
  }
  chartData?: { value: number }[]
  className?: string
  status?: "primary" | "success" | "warning" | "error" | "info"
}

const statusConfig = {
  primary: "text-primary bg-primary/10 border-primary/20",
  success: "text-green-600 bg-green-500/10 border-green-500/20",
  warning: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  error: "text-red-600 bg-red-500/10 border-red-500/20",
  info: "text-blue-600 bg-blue-500/10 border-blue-500/20",
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  chartData,
  className,
  status = "primary",
}: SummaryCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md border-muted/40", className)}>
      <CardContent className="p-0">
        <div className="flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "p-2.5 rounded-xl border transition-colors",
              statusConfig[status]
            )}>
              <Icon className="size-5" />
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                trend.isUp ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
              )}>
                {trend.isUp ? <IconArrowUpRight className="size-3" /> : <IconArrowDownRight className="size-3" />}
                {trend.value}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
            </div>
          </div>

          {trend?.label && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className={cn("font-medium", trend.isUp ? "text-green-600" : "text-red-600")}>
                {trend.isUp ? "+" : "-"}{trend.value}
              </span>
              {" "}{trend.label}
            </p>
          )}
        </div>

        {chartData && (
          <div className="h-16 w-full min-w-0 -mt-2">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 320, height: 64 }}
            >
              <LineChart data={chartData}>
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={false}
                  className={cn(
                    status === "primary" && "text-primary",
                    status === "success" && "text-green-500",
                    status === "warning" && "text-amber-500",
                    status === "error" && "text-red-500",
                    status === "info" && "text-blue-500"
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
