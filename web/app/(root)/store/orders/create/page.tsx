"use client"

import * as React from "react"
import { IconClipboardList, IconPlus, IconTrash, IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import type { StoreBuyer, StoreItem, CreateStoreOrderLineRequest } from "@/lib/types/store"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

function CreateOrderContent({ companyId }: { companyId: string }) {
    const router = useRouter();
    const [buyers, setBuyers] = React.useState<StoreBuyer[]>([]);
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);

    const [orderNumber, setOrderNumber] = React.useState(`ORD-${Date.now().toString().slice(-6)}`);
    const [buyerId, setBuyerId] = React.useState("");
    const [orderDate, setOrderDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [lines, setLines] = React.useState<Partial<CreateStoreOrderLineRequest>[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [buyersData, itemsData] = await Promise.all([
                    storeService.getBuyers(companyId),
                    storeService.getItems(companyId),
                ]);
                setBuyers(buyersData);
                setItems(itemsData);
            } catch {
                toast.error("Failed to load dependency data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [companyId]);

    const addLine = () => {
        setLines([...lines, { itemId: "", quantity: 0, unitPrice: 0 }]);
    };

    const updateLine = (index: number, field: keyof CreateStoreOrderLineRequest, value: string | number) => {
        const newList = [...lines];
        newList[index] = { ...newList[index], [field]: value };
        setLines(newList);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const handleSaveOrder = async () => {
        if (!buyerId) {
            toast.error("Please select a buyer");
            return;
        }
        if (lines.length === 0) {
            toast.error("Add at least one item to the order");
            return;
        }
        if (lines.some(i => !i.itemId || !i.quantity)) {
            toast.error("Please fill in all item details");
            return;
        }

        setSubmitting(true);
        try {
            await storeService.addOrder({
                companyId,
                orderNumber,
                buyerId,
                orderDate,
                lines: lines.map(l => {
                    const item = items.find(i => i.id === l.itemId);
                    return {
                        itemId: l.itemId!,
                        quantity: l.quantity!,
                        unitPrice: l.unitPrice ?? item?.unitPrice ?? 0,
                        unitName: item?.unitName ?? undefined,
                    };
                }),
            });
            toast.success("Order created successfully!");
            router.push("/store/orders/list");
        } catch {
            toast.error("Failed to create order");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <IconLoader2 className="animate-spin size-8 text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        <IconPlus className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Order</h1>
                        <p className="text-muted-foreground text-sm">Initiate a new inventory or purchase order.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="text-lg">Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase text-muted-foreground">Order Number</Label>
                            <Input value={orderNumber} readOnly className="bg-muted/50 font-mono font-bold text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <Label>Buyer / Customer</Label>
                            <Select value={buyerId} onValueChange={setBuyerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Buyer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {buyers.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.buyerName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Order Date</Label>
                            <Input
                                type="date"
                                value={orderDate}
                                onChange={e => setOrderDate(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div>
                            <CardTitle className="text-lg">Items in Order</CardTitle>
                            <CardDescription>Specify products and quantities.</CardDescription>
                        </div>
                        <Button variant="secondary" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white border-none" onClick={addLine}>
                            <IconPlus className="size-4" /> Add Line
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-bold">Item Description</TableHead>
                                        <TableHead className="w-[120px] font-bold">Quantity</TableHead>
                                        <TableHead className="w-[100px] font-bold">Unit</TableHead>
                                        <TableHead className="w-[60px] text-right font-bold"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic">
                                                No items added. Click &quot;Add Line&quot; to start.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lines.map((entry, idx) => {
                                            const selectedItem = items.find(i => i.id === entry.itemId);
                                            return (
                                                <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell>
                                                        <Select
                                                            value={entry.itemId}
                                                            onValueChange={v => updateLine(idx, 'itemId', v)}
                                                        >
                                                            <SelectTrigger className="border-none shadow-none focus:ring-0">
                                                                <SelectValue placeholder="Select Product" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {items.map(i => (
                                                                    <SelectItem key={i.id} value={i.id}>{i.itemName} ({i.itemCode})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            className="h-8 border-muted-foreground/20"
                                                            value={entry.quantity || ""}
                                                            onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value))}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-xs font-bold text-muted-foreground uppercase">
                                                        {selectedItem?.unitName || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right px-2">
                                                        <Button variant="ghost" size="sm" onClick={() => removeLine(idx)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                                                            <IconTrash className="size-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 p-4 rounded-xl bg-muted/30 border">
                            <Button variant="outline" onClick={() => router.back()}>Discard</Button>
                            <Button
                                className="gap-2 bg-green-600 hover:bg-green-700 text-white border-none px-8"
                                onClick={handleSaveOrder}
                                disabled={submitting || lines.length === 0}
                            >
                                {submitting ? <IconLoader2 className="animate-spin size-4" /> : <IconDeviceFloppy className="size-4" />}
                                Complete Order
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default function CreateOrderPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <CreateOrderContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
