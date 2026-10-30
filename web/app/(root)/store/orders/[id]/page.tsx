"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { IconClipboardList, IconLoader2, IconArrowLeft, IconCalendar } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

function OrderDetailContent({ companyId, orderId }: { companyId: string; orderId: string }) {
    const [order, setOrder] = React.useState<StoreOrder | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await storeService.getOrderById(orderId, companyId);
                setOrder(data);
            } catch {
                toast.error("Failed to load order");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [companyId, orderId]);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <IconLoader2 className="animate-spin size-8 text-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Order not found.
            </div>
        );
    }

    const lineTotal = order.lines.reduce((sum, l) => sum + l.lineTotal, 0);

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                        <IconClipboardList className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-mono">{order.orderNumber}</h1>
                        <p className="text-muted-foreground text-sm">{order.buyerName}</p>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/store/orders/list">
                        <IconArrowLeft className="size-4 mr-2" />
                        Back to List
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Order Header</CardTitle>
                    <CardDescription>Summary and status for this order.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Buyer</p>
                            <p className="font-semibold">{order.buyerName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Order Date</p>
                            <p className="font-semibold flex items-center gap-1">
                                <IconCalendar className="size-3.5" />
                                {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Status</p>
                            <Badge className="mt-1">{order.status}</Badge>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Line Items</p>
                            <p className="font-semibold">{order.lines.length}</p>
                        </div>
                    </div>
                    {order.remarks && (
                        <p className="mt-4 text-sm text-muted-foreground">Remarks: {order.remarks}</p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg">Order Lines</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Item</TableHead>
                                    <TableHead className="font-bold text-right">Quantity</TableHead>
                                    <TableHead className="font-bold">Unit</TableHead>
                                    <TableHead className="font-bold text-right">Unit Price</TableHead>
                                    <TableHead className="font-bold text-right">Line Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.lines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No line items on this order.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    order.lines.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell className="font-semibold">{line.itemName}</TableCell>
                                            <TableCell className="text-right font-mono">{line.quantity.toLocaleString()}</TableCell>
                                            <TableCell className="text-xs uppercase text-muted-foreground">{line.unitName}</TableCell>
                                            <TableCell className="text-right font-mono">৳ {line.unitPrice.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold">৳ {line.lineTotal.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {order.lines.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <p className="text-lg font-bold">Total: ৳ {lineTotal.toLocaleString()}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;

    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <OrderDetailContent companyId={companyId} orderId={orderId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
