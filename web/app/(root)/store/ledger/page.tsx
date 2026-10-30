"use client"

import * as React from "react"
import { IconFileSpreadsheet, IconDownload, IconFilter, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import type { StoreItem, StockLedgerEntry } from "@/lib/types/store"
import { toast } from "sonner"

function StockLedgerContent({ companyId }: { companyId: string }) {
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [selectedItemId, setSelectedItemId] = React.useState("");
    const [ledgerData, setLedgerData] = React.useState<StockLedgerEntry[]>([]);
    const [loadingItems, setLoadingItems] = React.useState(true);
    const [loadingLedger, setLoadingLedger] = React.useState(false);

    React.useEffect(() => {
        const fetchItems = async () => {
            try {
                const data = await storeService.getItems(companyId);
                setItems(data);
                if (data.length > 0) {
                    setSelectedItemId(data[0].id);
                }
            } catch {
                toast.error("Failed to load items");
            } finally {
                setLoadingItems(false);
            }
        };
        fetchItems();
    }, [companyId]);

    React.useEffect(() => {
        if (!selectedItemId) return;

        const fetchLedger = async () => {
            setLoadingLedger(true);
            try {
                const data = await storeService.getLedger(companyId, selectedItemId);
                setLedgerData(data);
            } catch {
                toast.error("Failed to load ledger");
                setLedgerData([]);
            } finally {
                setLoadingLedger(false);
            }
        };
        fetchLedger();
    }, [companyId, selectedItemId]);

    const selectedItem = items.find(i => i.id === selectedItemId);

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconFileSpreadsheet className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Stock Ledger</h1>
                        <p className="text-sm text-muted-foreground">
                            Detailed transaction history per item.
                        </p>
                    </div>
                </div>
                <Button variant="outline">
                    <IconDownload className="mr-2 size-4" />
                    Export PDF/Excel
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ledger Report</CardTitle>
                    <CardDescription>Select an item to view its stock movement history.</CardDescription>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="w-[300px]">
                            {loadingItems ? (
                                <IconLoader2 className="animate-spin size-5 text-muted-foreground" />
                            ) : (
                                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {items.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.itemName} ({item.itemCode})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <Button variant="secondary">
                            <IconFilter className="mr-2 size-4" />
                            Filter Date
                        </Button>
                    </div>
                    {selectedItem && (
                        <p className="text-sm text-muted-foreground pt-2">
                            Current balance: <span className="font-bold">{selectedItem.currentStock} {selectedItem.unitName}</span>
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">In Qty</TableHead>
                                    <TableHead className="text-right">Out Qty</TableHead>
                                    <TableHead className="text-right font-bold">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingLedger ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <IconLoader2 className="animate-spin size-6 mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : ledgerData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No ledger entries for this item.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ledgerData.map((row) => {
                                        const isIn = row.transactionType === "In";
                                        return (
                                            <TableRow key={row.transactionId}>
                                                <TableCell>{new Date(row.transactionDate).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{row.referenceNumber || row.transactionNumber}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${isIn
                                                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                        : 'bg-red-50 text-red-700 ring-red-600/20'
                                                        }`}>
                                                        {row.transactionType}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right text-green-600 font-medium">{row.quantityIn > 0 ? `+${row.quantityIn}` : '-'}</TableCell>
                                                <TableCell className="text-right text-red-600 font-medium">{row.quantityOut > 0 ? `-${row.quantityOut}` : '-'}</TableCell>
                                                <TableCell className="text-right font-bold">{row.runningBalance}</TableCell>
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

export default function StockLedgerPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <StockLedgerContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
