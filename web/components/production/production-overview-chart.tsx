"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const chartData = [
    { date: "2024-04-01", output: 1200, target: 1500 },
    { date: "2024-04-02", output: 1350, target: 1500 },
    { date: "2024-04-03", output: 1400, target: 1500 },
    { date: "2024-04-04", output: 1600, target: 1500 },
    { date: "2024-04-05", output: 1550, target: 1500 },
    { date: "2024-04-06", output: 1450, target: 1500 },
    { date: "2024-04-07", output: 1100, target: 1500 }, // Sunday/low
    { date: "2024-04-08", output: 1520, target: 1500 },
    { date: "2024-04-09", output: 1580, target: 1500 },
    { date: "2024-04-10", output: 1620, target: 1500 },
    { date: "2024-04-11", output: 1480, target: 1500 },
    { date: "2024-04-12", output: 1550, target: 1500 },
    { date: "2024-04-13", output: 1300, target: 1500 },
    { date: "2024-04-14", output: 1250, target: 1500 },
    { date: "2024-04-15", output: 1600, target: 1500 },
    { date: "2024-04-16", output: 1650, target: 1500 },
    { date: "2024-04-17", output: 1700, target: 1500 },
    { date: "2024-04-18", output: 1550, target: 1500 },
    { date: "2024-04-19", output: 1400, target: 1500 },
    { date: "2024-04-20", output: 1500, target: 1500 },
    { date: "2024-04-21", output: 1300, target: 1500 },
    { date: "2024-04-22", output: 1600, target: 1500 },
    { date: "2024-04-23", output: 1620, target: 1500 },
    { date: "2024-04-24", output: 1580, target: 1500 },
    { date: "2024-04-25", output: 1650, target: 1500 },
    { date: "2024-04-26", output: 1500, target: 1500 },
    { date: "2024-04-27", output: 1450, target: 1500 },
    { date: "2024-04-28", output: 1200, target: 1500 },
    { date: "2024-04-29", output: 1600, target: 1500 },
    { date: "2024-04-30", output: 1700, target: 1500 },
]

const chartConfig = {
    output: {
        label: "Output (Units)",
        color: "hsl(var(--primary))",
    },
    target: {
        label: "Target",
        color: "hsl(var(--muted-foreground))",
    },
} satisfies ChartConfig

export function ProductionOverviewChart() {
    const [timeRange, setTimeRange] = React.useState("30d")

    const filteredData = chartData.filter((item) => {
        const date = new Date(item.date)
        const referenceDate = new Date("2024-04-30")
        let daysToSubtract = 30
        if (timeRange === "7d") {
            daysToSubtract = 7
        }
        const startDate = new Date(referenceDate)
        startDate.setDate(startDate.getDate() - daysToSubtract)
        return date >= startDate
    })

    return (
        <Card>
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1 text-center sm:text-left">
                    <CardTitle>Production Output</CardTitle>
                    <CardDescription>
                        Showing daily production quantity vs target
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="w-[160px] rounded-lg sm:ml-auto"
                        aria-label="Select a value"
                    >
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={filteredData}>
                        <defs>
                            <linearGradient id="fillOutput" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--primary)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--primary)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey="target"
                            type="step"
                            fill="transparent"
                            stroke="var(--muted-foreground)"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                        />
                        <Area
                            dataKey="output"
                            type="natural"
                            fill="url(#fillOutput)"
                            stroke="var(--primary)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
