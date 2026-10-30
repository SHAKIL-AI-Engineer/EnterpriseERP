"use client"

import * as React from "react"
import { IconNotebook, IconPlus, IconSearch, IconDownload, IconLoader2, IconCircleCheck, IconClock } from "@tabler/icons-react"
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
import { storeService } from "@/lib/services/store"
import type { StoreBooking, StoreOrder, StoreItem, CreateStoreBookingRequest } from "@/lib/types/store"
import { toast } from "sonner"

interface BookingManagerProps {
    companyId: string;
    bookingType: string;
    description: string;
    accentColor?: string;
}

export default function BookingManagementPage({ companyId, bookingType, description, accentColor = "sky" }: BookingManagerProps) {
    const [bookings, setBookings] = React.useState<StoreBooking[]>([]);
    const [orders, setOrders] = React.useState<StoreOrder[]>([]);
    const [items, setItems] = React.useState<StoreItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    const [newBooking, setNewBooking] = React.useState<Omit<CreateStoreBookingRequest, "companyId">>({
        orderId: "",
        itemId: "",
        bookedQuantity: 0,
        bookingDate: new Date().toISOString().split('T')[0],
        bookingType: bookingType,
    });

    const fetchData = async () => {
        try {
            const [bookingData, orderData, itemData] = await Promise.all([
                storeService.getBookings(companyId, bookingType),
                storeService.getOrders(companyId),
                storeService.getItems(companyId),
            ]);
            setBookings(bookingData);
            setOrders(orderData);
            setItems(itemData);
        } catch {
            toast.error(`Failed to load ${bookingType} bookings`);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [companyId, bookingType]);

    const handleAddBooking = async () => {
        if (!newBooking.orderId || !newBooking.itemId || !newBooking.bookedQuantity) {
            toast.error("Please fill in all mandatory fields");
            return;
        }

        setSubmitting(true);
        try {
            await storeService.addBooking({ ...newBooking, companyId });
            toast.success("Material booking created successfully");
            setIsDialogOpen(false);
            setNewBooking({
                orderId: "",
                itemId: "",
                bookedQuantity: 0,
                bookingDate: new Date().toISOString().split('T')[0],
                bookingType: bookingType,
            });
            fetchData();
        } catch {
            toast.error("Failed to create booking");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.itemName.toLowerCase().includes(search.toLowerCase())
    );

    const colorClasses = {
        sky: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400",
        amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
        purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
        emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
        rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[accentColor as keyof typeof colorClasses]}`}>
                        <IconNotebook className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{bookingType} Booking</h1>
                        <p className="text-muted-foreground text-sm">{description}</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <IconPlus className="size-4" /> New Booking
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Material Allocation</DialogTitle>
                            <DialogDescription>Reserve {bookingType.toLowerCase()} for a specific production order.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Select Project/Order</Label>
                                <Select value={newBooking.orderId} onValueChange={v => setNewBooking({ ...newBooking, orderId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Link to Order #" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orders.map(o => <SelectItem key={o.id} value={o.id}>{o.orderNumber} - {o.buyerName || "No Buyer"}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Item to Book</Label>
                                <Select value={newBooking.itemId} onValueChange={v => setNewBooking({ ...newBooking, itemId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Search Inventory Item..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {items.map(i => <SelectItem key={i.id} value={i.id}>{i.itemName} ({i.itemCode})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Quantity Required</Label>
                                    <Input type="number" value={newBooking.bookedQuantity || ""} onChange={e => setNewBooking({ ...newBooking, bookedQuantity: parseFloat(e.target.value) })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Allocation Date</Label>
                                    <Input type="date" value={newBooking.bookingDate} onChange={e => setNewBooking({ ...newBooking, bookingDate: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddBooking} disabled={submitting}>
                                {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                                Finalize Booking
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Register of Bookings</CardTitle>
                            <CardDescription>View and manage all {bookingType.toLowerCase()} allocations.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                                <Input
                                    placeholder="Search by ID, Order or Item..."
                                    className="pl-10 h-10 w-[300px]"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="gap-2">
                                <IconDownload className="size-4" /> Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Booking ID</TableHead>
                                    <TableHead className="font-bold">Order Ref</TableHead>
                                    <TableHead className="font-bold">Allocated Item</TableHead>
                                    <TableHead className="font-bold text-center">Qty</TableHead>
                                    <TableHead className="font-bold">Date</TableHead>
                                    <TableHead className="font-bold text-center">Status</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-primary" />
                                            <p className="mt-2 text-sm text-muted-foreground font-medium">Syncing booking data...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredBookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                            No active bookings found for {bookingType}.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBookings.map((b) => (
                                        <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-mono font-bold text-primary">{b.bookingNumber}</TableCell>
                                            <TableCell className="font-medium">{b.orderNumber || "No Order"}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{b.itemName || "Unknown Item"}</span>
                                                    <span className="text-xs text-muted-foreground">{b.itemCode || "---"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold">
                                                {(b.bookedQuantity || 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground uppercase">{b.unitName || ""}</span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : "---"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                                                    {b.status === "Pending" ? (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                                            <IconClock className="size-3 mr-1" /> Pending
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                                                            <IconCircleCheck className="size-3 mr-1" /> Confirmed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-primary">Details</Button>
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
