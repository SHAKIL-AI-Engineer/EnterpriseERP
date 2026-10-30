"use client"

import * as React from "react"
import { IconAlertTriangle, IconRefresh, IconShoppingCart, IconLoader2, IconSearch } from "@tabler/icons-react"
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
import type { StoreItem } from "@/lib/types/store"
import { toast } from "sonner"

function ReorderAlertContent({ companyId }: { companyId: string }) {
    const [lowStockItems, setLowStockItems] = React.useState<StoreItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const fetchLowStock = async () => {
        setLoading(true);
        try {
            const data = await storeService.getLowStock(companyId);
            setLowStockItems(data);
        } catch {
            toast.error("Failed to fetch stock alerts");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchLowStock();
    }, [companyId]);

    const filtered = lowStockItems.filter(i =>
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.itemCode.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                        <IconAlertTriangle className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reorder Alerts</h1>
                        <p className="text-muted-foreground text-sm">Automated safety stock notifications.</p>
                    </div>
                </div>
                <Button className="gap-2 h-10 border-orange-200 text-orange-600 hover:bg-orange-50" variant="outline" onClick={fetchLowStock}>
                    <IconRefresh className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Rescan Warehouse
                </Button>
            </div>

            <Card className="border-none shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                <CardHeader className="bg-orange-50/30 dark:bg-orange-950/10 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Critical Stock Items
                                <Badge variant="destructive" className="rounded-full px-2 py-0 h-5 text-[10px] animate-bounce">
                                    {lowStockItems.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>Items that require immediate attention to prevent production stops.</CardDescription>
                        </div>
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input placeholder="Search alerts..." className="pl-10 w-[250px] h-9 border-orange-200 focus-visible:ring-orange-500" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border border-orange-100 dark:border-orange-900/30 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-orange-50/50 dark:bg-orange-950/20">
                                <TableRow>
                                    <TableHead className="font-bold text-orange-900 dark:text-orange-100">Item Detail</TableHead>
                                    <TableHead className="text-center font-bold text-orange-900 dark:text-orange-100">Current Qty</TableHead>
                                    <TableHead className="text-center font-bold text-orange-900 dark:text-orange-100">Safety Limit</TableHead>
                                    <TableHead className="font-bold text-orange-900 dark:text-orange-100">Unit</TableHead>
                                    <TableHead className="text-center font-bold text-orange-900 dark:text-orange-100">Status</TableHead>
                                    <TableHead className="text-right font-bold text-orange-900 dark:text-orange-100">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-orange-500" />
                                            <p className="mt-2 text-sm text-muted-foreground">Scanning stock levels...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium">
                                            All items are currently above safety stock levels.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((item) => {
                                        const isCritical = item.currentStock <= (item.minimumStockLevel * 0.3);
                                        return (
                                            <TableRow key={item.id} className="hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors border-orange-50 dark:border-orange-900/20">
                                                <TableCell className="font-bold">
                                                    <div className="flex flex-col">
                                                        <span>{item.itemName}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{item.itemCode}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`text-center font-black text-lg ${isCritical ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                                                    {item.currentStock.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-muted-foreground">
                                                    {item.minimumStockLevel.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-muted-foreground uppercase">{item.unitName}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={isCritical ? "bg-red-500 hover:bg-red-600 font-black px-4" : "bg-orange-500 hover:bg-orange-600 font-bold px-4"}>
                                                        {isCritical ? "CRITICAL" : "REORDER"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" className="gap-2 h-8 bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 px-4">
                                                        <IconShoppingCart className="size-3.5" /> Purchase
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

export default function ReorderAlertPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <ReorderAlertContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
