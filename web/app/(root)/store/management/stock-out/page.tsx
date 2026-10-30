"use client"

import * as React from "react"
import { IconTruckDelivery, IconPlus, IconLoader2, IconTrash, IconExclamationCircle } from "@tabler/icons-react"
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
import type { StoreItem } from "@/lib/types/store"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface StockOutItem {
    itemId: string;
    itemName: string;
    quantity: number;
    availableStock: number;
    unit: string;
}

function StockOutContent({ companyId }: { companyId: string }) {
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);

    const [issueNumber, setIssueNumber] = React.useState(`ISS-${Math.floor(Math.random() * 90000) + 10000}`);
    const [department, setDepartment] = React.useState("");
    const [reqNo, setReqNo] = React.useState("");
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [issueList, setIssueList] = React.useState<StockOutItem[]>([]);

    React.useEffect(() => {
        const fetchItems = async () => {
            try {
                const data = await storeService.getItems(companyId);
                setItems(data);
            } catch {
                toast.error("Failed to load items");
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [companyId]);

    const addItemToList = () => {
        setIssueList([...issueList, { itemId: "", itemName: "", quantity: 0, availableStock: 0, unit: "" }]);
    };

    const updateItemInList = (index: number, field: keyof StockOutItem, value: string | number) => {
        const newList = [...issueList];
        if (field === 'itemId') {
            const item = items.find(i => i.id === value);
            newList[index] = {
                ...newList[index],
                itemId: value as string,
                itemName: item?.itemName || "",
                availableStock: item?.currentStock || 0,
                unit: item?.unitName || "",
            };
        } else {
            newList[index] = { ...newList[index], [field]: value };
        }
        setIssueList(newList);
    };

    const removeItemFromList = (index: number) => {
        setIssueList(issueList.filter((_, i) => i !== index));
    };

    const handleCompleteStockOut = async () => {
        if (issueList.length === 0) {
            toast.error("Add at least one item to issue");
            return;
        }

        const insufficient = issueList.filter(i => i.quantity > i.availableStock);
        if (insufficient.length > 0) {
            toast.error(`Insufficient stock for: ${insufficient.map(i => i.itemName).join(", ")}`);
            return;
        }

        if (issueList.some(i => !i.itemId || i.quantity <= 0)) {
            toast.error("Please provide valid item and quantity for all entries");
            return;
        }

        setSubmitting(true);
        try {
            const promises = issueList.map(item =>
                storeService.stockOut({
                    companyId,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    referenceNumber: reqNo || issueNumber,
                    departmentOrLine: department,
                    transactionDate: date,
                })
            );

            await Promise.all(promises);
            toast.success("Materials issued and stock updated successfully!");

            const freshItems = await storeService.getItems(companyId);
            setItems(freshItems);
            setIssueList([]);
            setDepartment("");
            setReqNo("");
            setIssueNumber(`ISS-${Math.floor(Math.random() * 90000) + 10000}`);
        } catch {
            toast.error("Failed to process Stock Out.");
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
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                    <IconTruckDelivery className="size-7" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Stock Out (Issue)</h1>
                    <p className="text-muted-foreground text-sm">Issue materials to production lines or request for withdrawal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20">
                        <CardTitle className="text-lg">Distribution Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">Issue Number</Label>
                            <Input value={issueNumber} readOnly className="bg-muted/50 font-mono text-orange-600 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label>Target Department/Line</Label>
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sewing-L1">Sewing Line 1</SelectItem>
                                    <SelectItem value="Sewing-L2">Sewing Line 2</SelectItem>
                                    <SelectItem value="Cutting">Cutting Section</SelectItem>
                                    <SelectItem value="Finishing">Finishing Section</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Requisition Number</Label>
                            <Input placeholder="e.g. REQ-2024-500" value={reqNo} onChange={e => setReqNo(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Issue Date</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div>
                            <CardTitle className="text-lg">Issuance Item List</CardTitle>
                            <CardDescription>Verify availability before issuing materials.</CardDescription>
                        </div>
                        <Button variant="secondary" onClick={addItemToList} size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700 text-white border-none">
                            <IconPlus className="size-4" /> Add Line
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-bold">Item Identifier</TableHead>
                                        <TableHead className="w-[120px] font-bold">Issue Qty</TableHead>
                                        <TableHead className="w-[140px] font-bold text-center">Available Stock</TableHead>
                                        <TableHead className="w-[100px] font-bold">Unit</TableHead>
                                        <TableHead className="w-[60px] text-right font-bold"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issueList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">
                                                List is empty. Click &quot;Add Line&quot; to select items.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        issueList.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <Select value={item.itemId} onValueChange={val => updateItemInList(idx, 'itemId', val)}>
                                                        <SelectTrigger className="border-none shadow-none focus:ring-0 h-8">
                                                            <SelectValue placeholder="Search Item..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {items.map(i => (
                                                                <SelectItem key={i.id} value={i.id} disabled={i.currentStock <= 0}>
                                                                    {i.itemName} ({i.itemCode}) - {i.currentStock} {i.unitName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" className={`h-8 border-muted-foreground/20 ${item.quantity > item.availableStock ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`} value={item.quantity === 0 ? "" : item.quantity} onChange={e => updateItemInList(idx, 'quantity', parseFloat(e.target.value))} />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={`font-mono ${item.availableStock <= 0 ? 'text-rose-500 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                                        {item.availableStock} {item.unit}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-muted-foreground uppercase">{item.unit || "—"}</TableCell>
                                                <TableCell className="text-right px-2">
                                                    <Button variant="ghost" size="sm" onClick={() => removeItemFromList(idx)} className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                                        <IconTrash className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {issueList.some(i => i.quantity > i.availableStock) && (
                            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-sm border border-rose-100 dark:border-rose-900/40">
                                <IconExclamationCircle className="size-4 shrink-0" />
                                <span>One or more items exceed available stock levels. Please adjust quantities.</span>
                            </div>
                        )}

                        <div className="mt-8 flex flex-col md:flex-row items-center justify-end gap-4 p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
                            <Button variant="outline" onClick={() => setIssueList([])}>Clear All</Button>
                            <Button className="w-full md:w-auto px-10 bg-orange-600 hover:bg-orange-700 text-white border-none shadow-lg shadow-orange-600/20" onClick={handleCompleteStockOut} disabled={submitting || issueList.length === 0 || issueList.some(i => i.quantity > i.availableStock)}>
                                {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                                Finalize Material Issue
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default function StockOutPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <StockOutContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
