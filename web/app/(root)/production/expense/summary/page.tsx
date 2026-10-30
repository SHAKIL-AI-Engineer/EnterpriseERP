"use client"

import * as React from "react"
import { IconCash, IconTrendingUp, IconTrendingDown, IconAlertCircle, IconWallet } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ExpenseSummaryPage() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconWallet className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Expense Summary</h1>
                    <p className="text-sm text-muted-foreground">
                        Comprehensive overview of production costs and budget utilization.
                    </p>
                </div>
            </div>

            <div className="px-4 lg:px-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Fiscal Expense</CardTitle>
                            <IconCash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">৳ 45,231,890</div>
                            <p className="text-xs text-muted-foreground">+20.1% from last year</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
                            <IconTrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">৳ 3,769,324</div>
                            <p className="text-xs text-muted-foreground">Within budget range</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projected End Year</CardTitle>
                            <IconTrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">৳ 52,000,000</div>
                            <p className="text-xs text-muted-foreground">Expected to exceed budget by 2%</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disputed Requests</CardTitle>
                            <IconAlertCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Areas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Budget vs Actual</CardTitle>
                            <CardDescription>Comparison of allocated budget against actual spending per department.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="font-medium">Raw Material Procurement</div>
                                    <div className="text-muted-foreground">৳ 25.5M / ৳ 30M</div>
                                </div>
                                <Progress value={85} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="font-medium">Direct Labor</div>
                                    <div className="text-muted-foreground">৳ 12.2M / ৳ 12M</div>
                                </div>
                                <Progress value={101} className="h-2 bg-red-100 [&>div]:bg-red-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="font-medium">Factory Overhead</div>
                                    <div className="text-muted-foreground">৳ 4.5M / ৳ 5M</div>
                                </div>
                                <Progress value={90} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="font-medium">Maintenance & Repairs</div>
                                    <div className="text-muted-foreground">৳ 1.8M / ৳ 3M</div>
                                </div>
                                <Progress value={60} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="font-medium">Utilities (Power, Water)</div>
                                    <div className="text-muted-foreground">৳ 3.5M / ৳ 4M</div>
                                </div>
                                <Progress value={87.5} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Category Distribution</CardTitle>
                            <CardDescription>
                                Expense breakdown by major categories.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                        <div className="h-4 w-4 bg-blue-500 rounded-full" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Raw Materials</p>
                                        <p className="text-sm text-muted-foreground">55% of total expenses</p>
                                    </div>
                                    <div className="font-medium">৳ 25.5M</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                        <div className="h-4 w-4 bg-green-500 rounded-full" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Labor Cost</p>
                                        <p className="text-sm text-muted-foreground">27% of total expenses</p>
                                    </div>
                                    <div className="font-medium">৳ 12.2M</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                        <div className="h-4 w-4 bg-orange-500 rounded-full" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Overhead</p>
                                        <p className="text-sm text-muted-foreground">10% of total expenses</p>
                                    </div>
                                    <div className="font-medium">৳ 4.5M</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                        <div className="h-4 w-4 bg-purple-500 rounded-full" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">Utilities</p>
                                        <p className="text-sm text-muted-foreground">8% of total expenses</p>
                                    </div>
                                    <div className="font-medium">৳ 3.5M</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
