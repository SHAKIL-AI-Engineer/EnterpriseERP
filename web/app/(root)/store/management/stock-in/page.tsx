"use client"

import * as React from "react"
import { IconBoxSeam, IconPlus, IconScan, IconLoader2, IconTrash } from "@tabler/icons-react"
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

interface StockInItem {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    location: string;
}

function StockInContent({ companyId }: { companyId: string }) {
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);

    const [grnNumber, setGrnNumber] = React.useState(`GRN-${Math.floor(Math.random() * 90000) + 10000}`);
    const [supplier, setSupplier] = React.useState("");
    const [challanNo, setChallanNo] = React.useState("");
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [receiveList, setReceiveList] = React.useState<StockInItem[]>([]);

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
        setReceiveList([...receiveList, { itemId: "", itemName: "", quantity: 0, unit: "", location: "" }]);
    };

    const updateItemInList = (index: number, field: keyof StockInItem, value: string | number) => {
        const newList = [...receiveList];
        if (field === 'itemId') {
            const item = items.find(i => i.id === value);
            newList[index] = {
                ...newList[index],
                itemId: value as string,
                itemName: item?.itemName || "",
                unit: item?.unitName || "",
            };
        } else {
            newList[index] = { ...newList[index], [field]: value };
        }
        setReceiveList(newList);
    };

    const removeItemFromList = (index: number) => {
        setReceiveList(receiveList.filter((_, i) => i !== index));
    };

    const handleCompleteStockIn = async () => {
        if (receiveList.length === 0) {
            toast.error("Add at least one item to receive");
            return;
        }

        if (receiveList.some(i => !i.itemId || i.quantity <= 0)) {
            toast.error("Please provide valid item and quantity for all entries");
            return;
        }

        setSubmitting(true);
        try {
            const promises = receiveList.map(item =>
                storeService.stockIn({
                    companyId,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    referenceNumber: challanNo || grnNumber,
                    supplierName: supplier,
                    locationOrBin: item.location,
                    transactionDate: date,
                })
            );

            await Promise.all(promises);
            toast.success("Stock In process completed successfully!");
            setReceiveList([]);
            setSupplier("");
            setChallanNo("");
            setGrnNumber(`GRN-${Math.floor(Math.random() * 90000) + 10000}`);
        } catch {
            toast.error("Failed to process Stock In. Please check server logs.");
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                        <IconBoxSeam className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Stock In (GRN)</h1>
                        <p className="text-muted-foreground text-sm">Receive goods and materials into the warehouse.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                    <IconScan className="size-4" /> Scan Barcode
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20">
                        <CardTitle className="text-lg">Receive Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">GRN Number (System Generated)</Label>
                            <Input value={grnNumber} readOnly className="bg-muted/50 font-mono text-emerald-600 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label>Supplier Name</Label>
                            <Input placeholder="e.g. TexWorld Bangladesh" value={supplier} onChange={e => setSupplier(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Challan / Bill No</Label>
                            <Input placeholder="Enter Reference Number" value={challanNo} onChange={e => setChallanNo(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Arrival Date</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div>
                            <CardTitle className="text-lg">Received Items List</CardTitle>
                            <CardDescription>Specify quantities and storage locations for items.</CardDescription>
                        </div>
                        <Button variant="secondary" onClick={addItemToList} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                            <IconPlus className="size-4" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="font-bold">Item Description</TableHead>
                                        <TableHead className="w-[120px] font-bold">Qty Recv.</TableHead>
                                        <TableHead className="w-[80px] font-bold">Unit</TableHead>
                                        <TableHead className="w-[180px] font-bold">Storage Location</TableHead>
                                        <TableHead className="w-[60px] text-right font-bold"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receiveList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                                No items added yet. Click &quot;Add Item&quot; to start receiving.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        receiveList.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <Select value={item.itemId} onValueChange={val => updateItemInList(idx, 'itemId', val)}>
                                                        <SelectTrigger className="border-none shadow-none focus:ring-0 h-8">
                                                            <SelectValue placeholder="Search Inventory..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {items.map(i => <SelectItem key={i.id} value={i.id}>{i.itemName} ({i.itemCode})</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" placeholder="0" className="h-8 border-muted-foreground/20" value={item.quantity === 0 ? "" : item.quantity} onChange={e => updateItemInList(idx, 'quantity', parseFloat(e.target.value))} />
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-muted-foreground uppercase">{item.unit || "—"}</TableCell>
                                                <TableCell>
                                                    <Input placeholder="e.g. Bin A-1" className="h-8 border-muted-foreground/20" value={item.location} onChange={e => updateItemInList(idx, 'location', e.target.value)} />
                                                </TableCell>
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

                        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                                Total Items to Receive: <span className="font-bold">{receiveList.length}</span>
                            </div>
                            <Button className="w-full md:w-auto px-10 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-600/20" onClick={handleCompleteStockIn} disabled={submitting || receiveList.length === 0}>
                                {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                                Post GRN Entry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default function StockInPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <StockInContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
