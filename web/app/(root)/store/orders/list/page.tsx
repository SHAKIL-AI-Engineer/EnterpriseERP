"use client"

import * as React from "react"
import Link from "next/link"
import { IconList, IconSearch, IconDownload, IconLoader2, IconExternalLink, IconCalendar } from "@tabler/icons-react"
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
import type { StoreOrder } from "@/lib/types/store"
import { toast } from "sonner"

function OrderListContent({ companyId }: { companyId: string }) {
    const [orders, setOrders] = React.useState<StoreOrder[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");

    const fetchOrders = async () => {
        try {
            const data = await storeService.getOrders(companyId);
            setOrders(data);
        } catch {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchOrders();
    }, [companyId]);

    const filteredOrders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                        <IconList className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
                        <p className="text-muted-foreground text-sm">Centralized register of all inventory and purchase orders.</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Database Records</CardTitle>
                            <CardDescription>Track status and delivery timelines for active orders.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                                <Input
                                    placeholder="Order # or Buyer Name..."
                                    className="pl-10 w-[200px] md:w-[300px] h-9"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 h-9">
                                <IconDownload className="size-4" /> Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Order Number</TableHead>
                                    <TableHead className="font-bold">Buyer / Customer</TableHead>
                                    <TableHead className="font-bold text-center">Items Count</TableHead>
                                    <TableHead className="font-bold">Order Date</TableHead>
                                    <TableHead className="font-bold text-center">Status</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-indigo-500" />
                                            <p className="mt-2 text-sm text-muted-foreground">Fetching server records...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                            No orders found matching your query.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((ord) => (
                                        <TableRow key={ord.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {ord.orderNumber}
                                            </TableCell>
                                            <TableCell className="font-semibold">{ord.buyerName}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-none font-mono">
                                                    {ord.orderItemsCount} Lines
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <IconCalendar className="size-3.5 text-muted-foreground" />
                                                    {new Date(ord.orderDate).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={
                                                    ord.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-none px-3" :
                                                        ord.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-none px-3" :
                                                            "bg-blue-500/10 text-blue-600 border-none px-3"
                                                }>
                                                    {ord.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="gap-1.5 hover:text-indigo-600" asChild>
                                                    <Link href={`/store/orders/${ord.id}`}>
                                                        <IconExternalLink className="size-3.5" />
                                                        View
                                                    </Link>
                                                </Button>
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

export default function OrderListPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <OrderListContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
