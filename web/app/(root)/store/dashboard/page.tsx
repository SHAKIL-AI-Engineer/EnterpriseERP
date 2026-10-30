"use client"

import * as React from "react"
import {
    IconPackages,
    IconAlertTriangle,
    IconTrendingUp,
    IconTrendingDown,
    IconShoppingCart,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { StockDashboardSummary, StoreItem, StockTransaction } from "@/lib/types/store"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardContent({ companyId }: { companyId: string }) {
    const [summary, setSummary] = React.useState<StockDashboardSummary | null>(null);
    const [lowStock, setLowStock] = React.useState<StoreItem[]>([]);
    const [recentTx, setRecentTx] = React.useState<StockTransaction[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryData, lowStockData, txData] = await Promise.all([
                    storeService.getDashboardSummary(companyId),
                    storeService.getLowStock(companyId),
                    storeService.getTransactions(companyId),
                ]);
                setSummary(summaryData);
                setLowStock(lowStockData.slice(0, 5));
                setRecentTx(txData.slice(0, 5));
            } catch (error) {
                console.error("Dashboard error:", error);
                toast.error("Failed to load real-time dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [companyId]);

    if (loading) {
        return (
            <>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="col-span-3 h-64 w-full" />
                    <Skeleton className="col-span-4 h-64 w-full" />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <IconPackages className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Store Overview</h1>
                    <p className="text-sm text-muted-foreground">Inventory health and movement summary.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                        <div className="h-4 w-4 text-primary font-bold">৳</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳ {summary?.totalStockValue.toLocaleString() || "0"}</div>
                        <p className="text-xs text-muted-foreground">Warehouse valuation</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active SKUs</CardTitle>
                        <IconPackages className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.activeSKUs || "0"}</div>
                        <p className="text-xs text-muted-foreground">Items in master list</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                        <IconAlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{summary?.lowStockItems || "0"}</div>
                        <p className="text-xs text-muted-foreground">Items needing attention</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                        <IconShoppingCart className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.pendingBookings || "0"}</div>
                        <p className="text-xs text-muted-foreground">Awaiting material issue</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Critical Stock</CardTitle>
                                <CardDescription>Below minimum safety level.</CardDescription>
                            </div>
                            {lowStock.length > 0 && <Badge variant="destructive">{lowStock.length} Items</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lowStock.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">All stock levels are healthy.</p>
                        ) : (
                            lowStock.map((item) => (
                                <div key={item.id} className="flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{item.itemName}</p>
                                        <p className="text-xs text-muted-foreground">Safety: {item.minimumStockLevel} {item.unitName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{item.currentStock} {item.unitName}</p>
                                        </div>
                                        <Badge variant="outline" className="border-rose-200 text-rose-600 dark:border-rose-900/50">Low</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="pt-2">
                            <Progress value={summary?.activeSKUs ? 100 - (summary.lowStockItems / summary.activeSKUs * 100) : 100} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                {summary?.activeSKUs ? (100 - (summary.lowStockItems / summary.activeSKUs * 100)).toFixed(0) : 100}% Inventory Health
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Movement</CardTitle>
                        <CardDescription>Latest inventory transactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentTx.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent movements recorded.</p>
                            ) : (
                                recentTx.map((tx) => {
                                    const isIn = tx.transactionType === "In";
                                    return (
                                        <div key={tx.id} className="flex items-center justify-between border-b dark:border-border pb-4 last:border-0 last:pb-0 hover:bg-muted/50 transition-colors p-2 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${isIn ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                                                    {!isIn ? <IconTrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <IconTrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{tx.itemName}</p>
                                                    <p className="text-xs text-muted-foreground">{tx.transactionNumber} • {new Date(tx.transactionDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className={`font-mono font-bold ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {isIn ? '+' : '-'}{tx.quantity}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default function StoreDashboard() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <DashboardContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
