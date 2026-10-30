"use client"

import * as React from "react"
import { IconBoxSeam, IconSearch, IconFilter, IconDownload, IconLoader2, IconDatabase, IconChartBar, IconCurrencyTaka } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { StoreItem, StockDashboardSummary } from "@/lib/types/store"
import { toast } from "sonner"

function CurrentStockContent({ companyId }: { companyId: string }) {
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [summary, setSummary] = React.useState<StockDashboardSummary | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const fetchData = async () => {
        try {
            const [itemData, summaryData] = await Promise.all([
                storeService.getItems(companyId),
                storeService.getDashboardSummary(companyId),
            ]);
            setItems(itemData);
            setSummary(summaryData);
        } catch {
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [companyId]);

    const filteredItems = items.filter(i =>
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        i.categoryName?.toLowerCase().includes(search.toLowerCase())
    );

    const totalStockQty = items.reduce((sum, i) => sum + i.currentStock, 0);

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <IconBoxSeam className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Current Stock</h1>
                        <p className="text-muted-foreground text-sm">Real-time inventory levels and total warehouse valuation.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 h-10">
                    <IconDownload className="size-4" /> Export Ledger
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <Card className="border-none shadow-sm bg-linear-to-br from-blue-50/50 via-white to-white dark:from-blue-900/10 dark:via-background dark:to-background">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Total Units in Stock</CardTitle>
                            <IconDatabase className="size-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "---" : totalStockQty.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-medium">Updated just now</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-linear-to-br from-indigo-50/50 via-white to-white dark:from-indigo-900/10 dark:via-background dark:to-background">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Active SKUs</CardTitle>
                            <IconChartBar className="size-4 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "---" : items.length}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-medium italic">Across {new Set(items.map(i => i.categoryId)).size} categories</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-linear-to-br from-emerald-50/50 via-white to-white dark:from-emerald-900/10 dark:via-background dark:to-background">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Stock Valuation</CardTitle>
                            <IconCurrencyTaka className="size-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">৳ {loading ? "---" : (summary?.totalStockValue || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">Estimated asset value</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-[500px]">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input placeholder="Search by name, SKU or category..." className="pl-10 h-10 border-muted-foreground/20" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 h-10">
                            <IconFilter className="size-4" /> Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Item Description</TableHead>
                                    <TableHead className="font-bold">Category</TableHead>
                                    <TableHead className="text-center font-bold">Current Qty</TableHead>
                                    <TableHead className="font-bold">Unit</TableHead>
                                    <TableHead className="text-right font-bold">Avg. Unit Price</TableHead>
                                    <TableHead className="text-right font-bold">Total Valuation</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-blue-500" />
                                            <p className="mt-2 text-sm text-muted-foreground font-medium">Recalculating inventory data...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium italic">
                                            Inventory is empty. Add items to see them here.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-bold">
                                                <div className="flex flex-col">
                                                    <span>{item.itemName}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono uppercase">{item.itemCode}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-bold text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-none">
                                                    {item.categoryName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-center font-black ${item.currentStock <= item.minimumStockLevel ? 'text-rose-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {item.currentStock.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-muted-foreground uppercase">{item.unitName}</TableCell>
                                            <TableCell className="text-right font-mono text-sm italic text-muted-foreground">
                                                ৳ {item.unitPrice.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-foreground">
                                                ৳ {(item.currentStock * item.unitPrice).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

export default function CurrentStockPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <CurrentStockContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
