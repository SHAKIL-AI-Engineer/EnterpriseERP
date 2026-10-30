"use client"

import * as React from "react"
import { IconPackageOff, IconDownload, IconLoader2, IconAlertTriangle, IconDatabaseOff, IconSearch } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import type { StoreBooking } from "@/lib/types/store"
import { toast } from "sonner"

function ShortageReportContent({ companyId }: { companyId: string }) {
    const [report, setReport] = React.useState<StoreBooking[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const fetchReport = async () => {
        setLoading(true);
        try {
            const data = await storeService.getShortageReport(companyId);
            setReport(data);
        } catch {
            toast.error("Failed to generate shortage report");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchReport();
    }, [companyId]);

    const filtered = report.filter(i =>
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        i.orderNumber.toLowerCase().includes(search.toLowerCase())
    );

    const totalShortageQty = report.reduce((sum, item) => sum + (item.bookedQuantity - (item.issuedQty || 0)), 0);

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                        <IconPackageOff className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-orange-700 dark:text-orange-400">Shortage Analysis</h1>
                        <p className="text-muted-foreground text-sm">Critical gaps between required bookings and actual inventory.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10">
                    <IconDownload className="size-4" /> Download PDF Analysis
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Card className="border-none shadow-sm bg-orange-50/50 dark:bg-orange-950/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Shortage Qty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{loading ? "---" : totalShortageQty.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Estimated shortfall for production</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-rose-50/50 dark:bg-rose-950/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">At Risk Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{loading ? "---" : new Set(report.map(r => r.orderId)).size}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Orders with material gaps</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-[500px]">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input placeholder="Search by Order #, Item or Code..." className="pl-10 h-10 border-muted-foreground/20" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Button variant="outline" size="sm" className="h-10 hover:bg-muted" onClick={fetchReport}>
                            <IconAlertTriangle className="size-4 mr-2" /> Recalculate Logic
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Order / Project</TableHead>
                                    <TableHead className="font-bold">Booked Item</TableHead>
                                    <TableHead className="text-center font-bold italic">Unit</TableHead>
                                    <TableHead className="text-center font-bold">Total Required</TableHead>
                                    <TableHead className="text-center font-bold">Already Issued</TableHead>
                                    <TableHead className="text-right font-bold text-orange-600 bg-orange-50/50 dark:bg-orange-950/20">Net Gap</TableHead>
                                    <TableHead className="text-center font-bold w-[150px]">Priority</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-orange-500" />
                                            <p className="mt-2 text-sm text-muted-foreground font-medium italic">Analyzing inventory gaps...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <IconDatabaseOff className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                                            <p className="text-sm text-muted-foreground font-medium">No material shortages reported. Ready for production!</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((item) => {
                                        const shortage = item.bookedQuantity - (item.issuedQty || 0);
                                        const ratio = (shortage / item.bookedQuantity) * 100;
                                        return (
                                            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-bold text-sm">{item.orderNumber}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{item.itemName}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{item.itemCode}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-bold text-muted-foreground uppercase">{item.unitName}</TableCell>
                                                <TableCell className="text-center font-mono font-medium">{item.bookedQuantity.toLocaleString()}</TableCell>
                                                <TableCell className="text-center font-mono text-muted-foreground">{(item.issuedQty || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-black text-orange-600 bg-orange-50/20 dark:bg-orange-950/10">
                                                    {shortage.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col gap-1.5 px-2">
                                                        <div className="flex items-center justify-between text-[10px] uppercase font-black">
                                                            <span>Gap</span>
                                                            <span className={ratio > 50 ? "text-rose-600" : "text-amber-600"}>{Math.round(ratio)}%</span>
                                                        </div>
                                                        <Progress value={ratio} className={`h-1.5 ${ratio > 50 ? "[&>div]:bg-rose-500" : "[&>div]:bg-amber-500"}`} />
                                                    </div>
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

export default function ShortageReportPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <ShortageReportContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
