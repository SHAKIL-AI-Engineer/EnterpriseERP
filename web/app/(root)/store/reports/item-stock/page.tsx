"use client"

import * as React from "react"
import { IconBoxSeam, IconDownload, IconSearch, IconLoader2, IconDatabase } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"

function ItemStockReportContent({ companyId }: { companyId: string }) {
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await storeService.getItemStockReport(companyId);
            setItems(data);
        } catch {
            toast.error("Failed to fetch inventory report");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchItems();
    }, [companyId]);

    const filtered = items.filter(i =>
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        i.categoryName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800">
                        <IconBoxSeam className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inventory Stock Ledger</h1>
                        <p className="text-muted-foreground text-sm">Comprehensive list of all warehouse items with stock movements.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 border-cyan-200 hover:bg-cyan-50 h-10">
                    <IconDownload className="size-4" /> Export Report
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-[400px]">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input placeholder="Search by SKU, Name or Category..." className="pl-10 h-10 border-muted-foreground/20" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Badge variant="outline" className="h-8 px-4 font-bold bg-white text-cyan-600 border-cyan-100">
                            Total SKUs: {items.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold w-[120px]">SKU Code</TableHead>
                                    <TableHead className="font-bold">Item Description</TableHead>
                                    <TableHead className="font-bold">Category</TableHead>
                                    <TableHead className="text-right font-bold">Opening</TableHead>
                                    <TableHead className="text-right font-bold text-green-600">Avg. Price</TableHead>
                                    <TableHead className="text-right font-bold text-foreground bg-muted/20">Current Stock</TableHead>
                                    <TableHead className="text-right font-bold">Total Asset</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-60 text-center">
                                            <IconLoader2 className="animate-spin size-10 mx-auto text-cyan-500 mb-2" />
                                            <p className="text-muted-foreground font-bold italic">Compiling inventory report...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <IconDatabase className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                                            <p className="text-sm text-muted-foreground font-medium">No items found in inventory.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-cyan-50/20 transition-colors">
                                            <TableCell className="font-mono text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                                                {item.itemCode}
                                            </TableCell>
                                            <TableCell className="font-bold text-sm">{item.itemName}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-bold text-[10px] uppercase bg-cyan-50/50 text-cyan-700 border-none">
                                                    {item.categoryName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium text-muted-foreground">
                                                {item.openingStock.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                ৳ {item.unitPrice.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-foreground bg-muted/5">
                                                {item.currentStock.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">{item.unitName}</span>
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

export default function ItemWiseStockPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <ItemStockReportContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
