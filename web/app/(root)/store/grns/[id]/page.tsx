"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { IconTruckDelivery, IconLoader2, IconArrowLeft } from "@tabler/icons-react"
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
import type { Grn } from "@/lib/types/store"
import { toast } from "sonner"

function GrnDetailContent({ companyId, grnId }: { companyId: string; grnId: string }) {
    const [grn, setGrn] = React.useState<Grn | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchGrn = async () => {
            try {
                const data = await storeService.getGrnById(grnId, companyId);
                setGrn(data);
            } catch {
                toast.error("Failed to load GRN");
            } finally {
                setLoading(false);
            }
        };
        fetchGrn();
    }, [companyId, grnId]);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <IconLoader2 className="animate-spin size-8 text-primary" />
            </div>
        );
    }

    if (!grn) {
        return <div className="text-center py-12 text-muted-foreground">GRN not found.</div>;
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <IconTruckDelivery className="size-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-mono">{grn.grnNo}</h1>
                        <p className="text-muted-foreground text-sm">{grn.supplier}</p>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/store/grn">
                        <IconArrowLeft className="size-4 mr-2" />
                        Back to GRN List
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">GRN Header</CardTitle>
                    <CardDescription>Receipt details and status.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Supplier</p>
                            <p className="font-semibold">{grn.supplier}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Receive Date</p>
                            <p className="font-semibold">{new Date(grn.grnDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">PO Reference</p>
                            <p className="font-semibold">{grn.poReference || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Status</p>
                            <Badge className="mt-1">{grn.status}</Badge>
                        </div>
                    </div>
                    <p className="mt-4 text-lg font-bold text-right">Total: ৳ {grn.totalAmount.toLocaleString()}</p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg">GRN Lines</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Item</TableHead>
                                    <TableHead className="font-bold text-right">Quantity</TableHead>
                                    <TableHead className="font-bold text-right">Rate</TableHead>
                                    <TableHead className="font-bold text-right">Line Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grn.lines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No line items on this GRN.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    grn.lines.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell className="font-semibold">{line.itemName}</TableCell>
                                            <TableCell className="text-right font-mono">{line.quantity.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono">৳ {line.rate.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold">৳ {line.lineTotal.toLocaleString()}</TableCell>
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

export default function GrnDetailPage() {
    const params = useParams();
    const grnId = params.id as string;

    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <GrnDetailContent companyId={companyId} grnId={grnId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
