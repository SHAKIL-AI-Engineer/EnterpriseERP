"use client"

import * as React from "react"
import {
    IconSearch,
    IconArrowRight,
    IconLayoutDashboard,
    IconUsers,
    IconReceipt,
    IconFilter,
    IconHistory,
    IconLoader2
} from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Mock Data for Search
const allItems = [
    { title: "Employee List", type: "Page", module: "HR", url: "/management/human-resource/employee-info", icon: IconUsers },
    { title: "Daily Production Report", type: "Page", module: "Production", url: "/production/daily-report", icon: IconLayoutDashboard },
    { title: "Salary Sheet", type: "Report", module: "Payroll", url: "/management/payroll/salary-sheet", icon: IconReceipt },
    { title: "Cutting Dashboard", type: "Dashboard", module: "Cutting", url: "/cutting/dashboard", icon: IconLayoutDashboard },
    { title: "Inventory Stock", type: "Page", module: "Store", url: "/store/inventory", icon: IconLayoutDashboard },
    { title: "Add New Employee", type: "Action", module: "HR", url: "/management/human-resource/employee-info/create", icon: IconUsers },
    { title: "Monthly Profit & Loss", type: "Report", module: "Production", url: "/production/profit-loss", icon: IconReceipt },
]

export default function SearchPage() {
    const [query, setQuery] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [filter, setFilter] = React.useState("All")

    // Filter logic
    const filteredResults = React.useMemo(() => {
        if (!query) return []
        return allItems.filter(item => {
            const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase())
            const matchesFilter = filter === "All" || item.module === filter
            return matchesQuery && matchesFilter
        })
    }, [query, filter])

    // Simulate network delay
    React.useEffect(() => {
        if (query) {
            setLoading(true)
            const timer = setTimeout(() => setLoading(false), 300)
            return () => clearTimeout(timer)
        }
    }, [query])

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
            <div className="border-b px-4 py-6 md:px-8 bg-background sticky top-0 z-10">
                <div className="mx-auto max-w-3xl space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight">Global Search</h1>
                    <div className="relative">
                        <IconSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="h-12 w-full rounded-xl border-2 pl-12 pr-4 text-lg shadow-sm focus-visible:ring-0 focus-visible:border-primary"
                            placeholder="Type to search modules, pages, or actions..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading && (
                            <IconLoader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary animate-spin" />
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <IconFilter className="h-4 w-4 text-muted-foreground shrink-0" />
                        {["All", "HR", "Production", "Store", "Payroll"].map((tab) => (
                            <Button
                                key={tab}
                                variant={filter === tab ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter(tab)}
                                className="rounded-full"
                            >
                                {tab}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-muted/20">
                <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
                    {!query ? (
                        <div className="text-center py-12">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <IconSearch className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">Start searching</h3>
                            <p className="text-muted-foreground">Find anything across HR, Production, and Store modules.</p>

                            <div className="mt-8 text-left">
                                <h4 className="mb-3 text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <IconHistory className="h-4 w-4" /> Recent Searches
                                </h4>
                                <div className="space-y-1">
                                    {["Monthly Reports", "Add Employee", "Fabric Stock"].map(recent => (
                                        <button
                                            key={recent}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                            onClick={() => setQuery(recent)}
                                        >
                                            {recent}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredResults.length > 0 ? (
                                <>
                                    <p className="text-sm text-muted-foreground font-medium px-1">
                                        Found {filteredResults.length} results
                                    </p>
                                    {filteredResults.map((item, index) => (
                                        <Link
                                            href={item.url}
                                            key={index}
                                            className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-lg",
                                                    item.module === 'HR' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" :
                                                        item.module === 'Production' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20" :
                                                            "bg-green-100 text-green-600 dark:bg-green-900/20"
                                                )}>
                                                    <item.icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold group-hover:text-primary transition-colors">{item.title}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{item.module}</span>
                                                        <span>•</span>
                                                        <span>{item.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <IconArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                        </Link>
                                    ))}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No results found for &quot;{query}&quot;.</p>
                                    <Button variant="link" onClick={() => setQuery("")}>Clear search</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
