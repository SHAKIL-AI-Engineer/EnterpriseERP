"use client"

import * as React from "react"
import { IconSettings, IconPlus, IconSearch, IconDownload, IconFilter, IconLoader2, IconCircleCheck } from "@tabler/icons-react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { StoreItem, ItemCategory, StoreUnit, CreateStoreItemRequest } from "@/lib/types/store"
import { toast } from "sonner"

function ItemSetupContent({ companyId }: { companyId: string }) {
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [categories, setCategories] = React.useState<ItemCategory[]>([]);
    const [units, setUnits] = React.useState<StoreUnit[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    const [newItem, setNewItem] = React.useState<Omit<CreateStoreItemRequest, "companyId">>({
        itemCode: "",
        itemName: "",
        categoryId: "",
        unitId: "",
        openingStock: 0,
        minimumStockLevel: 0,
        unitPrice: 0,
        description: "",
    });

    const fetchData = async () => {
        try {
            const [itemsData, catsData, unitsData] = await Promise.all([
                storeService.getItems(companyId),
                storeService.getCategories(companyId),
                storeService.getUnits(companyId),
            ]);
            setItems(itemsData);
            setCategories(catsData);
            setUnits(unitsData);
        } catch {
            toast.error("Failed to load item data");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [companyId]);

    const handleAddItem = async () => {
        if (!newItem.itemCode || !newItem.itemName || !newItem.categoryId || !newItem.unitId) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            await storeService.addItem({ ...newItem, companyId });
            toast.success("Item created successfully");
            setIsDialogOpen(false);
            setNewItem({
                itemCode: "",
                itemName: "",
                categoryId: "",
                unitId: "",
                openingStock: 0,
                minimumStockLevel: 0,
                unitPrice: 0,
                description: "",
            });
            fetchData();
        } catch {
            toast.error("Failed to create item");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
                        <IconSettings className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Item Setup</h1>
                        <p className="text-muted-foreground text-sm">Create and manage inventory items and raw materials.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <IconDownload className="size-4" /> Export
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <IconPlus className="size-4" /> Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Register New Item</DialogTitle>
                                <DialogDescription>Enter the details of the new item to track in inventory.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Item Code (SKU)</Label>
                                    <Input id="code" value={newItem.itemCode} onChange={e => setNewItem({ ...newItem, itemCode: e.target.value })} placeholder="e.g. RM-001" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Item Name</Label>
                                    <Input id="name" value={newItem.itemName} onChange={e => setNewItem({ ...newItem, itemName: e.target.value })} placeholder="e.g. Cotton Yarn 80/1" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={newItem.categoryId} onValueChange={val => setNewItem({ ...newItem, categoryId: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.categoryName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Unit of Measure</Label>
                                    <Select value={newItem.unitId} onValueChange={val => setNewItem({ ...newItem, unitId: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(u => <SelectItem key={u.id} value={u.id}>{u.unitName} ({u.shortName})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Opening Stock</Label>
                                    <Input type="number" value={newItem.openingStock} onChange={e => setNewItem({ ...newItem, openingStock: parseFloat(e.target.value) })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="safety">Safety Stock Level</Label>
                                    <Input type="number" value={newItem.minimumStockLevel} onChange={e => setNewItem({ ...newItem, minimumStockLevel: parseFloat(e.target.value) })} />
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label htmlFor="desc">Description</Label>
                                    <Input id="desc" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddItem} disabled={submitting}>
                                    {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                                    Create Item
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                    <CardTitle className="text-lg">Items Database</CardTitle>
                    <CardDescription>Real-time view of your item master catalogue.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                        <div className="relative flex-1 w-full mt-2">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input
                                placeholder="Search items by name or code..."
                                className="pl-10 h-10 border-muted-foreground/20"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="gap-2 border-dashed">
                            <IconFilter className="size-4" /> Advanced Filters
                        </Button>
                    </div>

                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50 dark:bg-muted/20">
                                <TableRow>
                                    <TableHead className="font-bold w-[120px]">Code</TableHead>
                                    <TableHead className="font-bold">Item Name</TableHead>
                                    <TableHead className="font-bold">Category</TableHead>
                                    <TableHead className="font-bold text-center">Unit</TableHead>
                                    <TableHead className="font-bold text-right">In Stock</TableHead>
                                    <TableHead className="font-bold text-center w-[120px]">Status</TableHead>
                                    <TableHead className="font-bold text-center w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-primary" />
                                            <p className="mt-2 text-sm text-muted-foreground">Synchronizing items...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                            No items found matching your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/30 transition-shadow">
                                            <TableCell className="font-mono text-xs font-bold text-primary">{item.itemCode}</TableCell>
                                            <TableCell className="font-semibold">{item.itemName}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-medium bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-none">{item.categoryName}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center italic">{item.unitName}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                <span className={item.currentStock <= item.minimumStockLevel ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                                                    {item.currentStock.toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 py-1 px-2 rounded-full">
                                                    <IconCircleCheck className="size-3.5" />
                                                    Active
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-primary">
                                                    <IconSettings className="size-4" />
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

export default function ItemSetupPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <ItemSetupContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
