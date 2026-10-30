"use client"

import * as React from "react"
import { IconDownload, IconSearch, IconReportSearch, IconLoader2, IconDatabaseShare } from "@tabler/icons-react"
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
import type { BookingVsIssueLine } from "@/lib/types/store"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

function BookingVsIssueContent({ companyId }: { companyId: string }) {
    const [lines, setLines] = React.useState<BookingVsIssueLine[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const fetchReport = async () => {
        setLoading(true);
        try {
            const data = await storeService.getBookingVsIssueReport(companyId);
            setLines(data);
        } catch {
            toast.error("Failed to load booking analysis report");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchReport();
    }, [companyId]);

    const filtered = lines.filter(b =>
        b.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.itemName.toLowerCase().includes(search.toLowerCase()) ||
        b.bookingNumber.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
                        <IconReportSearch className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Booking vs Issue Report</h1>
                        <p className="text-muted-foreground text-sm">Real-time comparison of material allocation against warehouse issuance.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 h-10 border-slate-200 hover:bg-slate-50">
                    <IconDownload className="size-4" /> Download Analysis
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-[500px]">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input placeholder="Search by Order #, Item Name or Booking ID..." className="pl-10 h-10 border-muted-foreground/20" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Badge variant="outline" className="h-8 px-4 bg-slate-100 text-slate-800 font-bold border-slate-200 uppercase tracking-tight">
                            Total Records: {lines.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Project Ref</TableHead>
                                    <TableHead className="font-bold">Booking Details</TableHead>
                                    <TableHead className="font-bold">Allocated Item</TableHead>
                                    <TableHead className="text-right font-bold">Booked Qty</TableHead>
                                    <TableHead className="text-right font-bold text-blue-600 dark:text-blue-400">Issued Qty</TableHead>
                                    <TableHead className="text-center font-bold w-[220px]">Fulfillment Status</TableHead>
                                    <TableHead className="text-right font-bold">Un-issued Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-60 text-center">
                                            <IconLoader2 className="animate-spin size-10 mx-auto text-slate-900 mb-2" />
                                            <p className="text-muted-foreground font-bold italic tracking-wide">Syncing fulfillment data...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <IconDatabaseShare className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                                            <p className="text-sm text-muted-foreground font-medium">No material bookings found for analysis.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((b) => {
                                        const issued = b.issuedQty || 0;
                                        const booked = b.bookedQuantity || 1;
                                        const percentage = Math.round((issued / booked) * 100);
                                        const balance = b.remaining;

                                        return (
                                            <TableRow key={b.bookingId} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-bold text-sm tracking-tight">{b.orderNumber}</TableCell>
                                                <TableCell className="font-mono text-[10px] font-black uppercase text-muted-foreground">{b.bookingNumber}</TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-sm">{b.itemName}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium">
                                                    {b.bookedQuantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-black text-blue-600 dark:text-blue-400">
                                                    {issued.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5 px-2">
                                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                                            <span>{percentage}% Complete</span>
                                                            <span className={percentage === 100 ? "text-emerald-600" : "text-amber-600"}>
                                                                {percentage === 100 ? "FULLY ISSUED" : "IN PROGRESS"}
                                                            </span>
                                                        </div>
                                                        <Progress value={percentage} className={`h-1.5 ${percentage === 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-blue-500"}`} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`text-right font-black ${balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                    {balance.toLocaleString()}
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

export default function BookingVsIssueReportPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <BookingVsIssueContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
