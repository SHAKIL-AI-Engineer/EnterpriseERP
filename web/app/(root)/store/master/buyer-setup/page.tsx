"use client"

import * as React from "react"
import { IconUsers, IconPlus, IconSearch, IconLoader2, IconWorld } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { StoreBuyer, CreateStoreBuyerRequest } from "@/lib/types/store"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

function BuyerSetupContent({ companyId }: { companyId: string }) {
    const [buyers, setBuyers] = React.useState<StoreBuyer[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    const [newBuyer, setNewBuyer] = React.useState<Omit<CreateStoreBuyerRequest, "companyId">>({
        buyerName: "",
        country: "",
        contactPerson: "",
        email: "",
        phone: "",
    });

    const fetchBuyers = async () => {
        try {
            const data = await storeService.getBuyers(companyId);
            setBuyers(data);
        } catch {
            toast.error("Failed to load buyers");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchBuyers();
    }, [companyId]);

    const handleAddBuyer = async () => {
        if (!newBuyer.buyerName) {
            toast.error("Buyer name is required");
            return;
        }

        setSubmitting(true);
        try {
            await storeService.addBuyer({ ...newBuyer, companyId });
            toast.success("Buyer registered successfully");
            setIsDialogOpen(false);
            setNewBuyer({ buyerName: "", country: "", contactPerson: "", email: "", phone: "" });
            fetchBuyers();
        } catch {
            toast.error("Failed to register buyer");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBuyers = buyers.filter(b =>
        b.buyerName.toLowerCase().includes(search.toLowerCase()) ||
        b.country?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                        <IconUsers className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Buyer Setup</h1>
                        <p className="text-muted-foreground text-sm">Manage store buyers and global customers.</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white border-none">
                            <IconPlus className="size-4" /> Add Buyer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Register New Buyer</DialogTitle>
                            <DialogDescription>Add a new buyer profile to the store system.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Buyer Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Walmart"
                                    value={newBuyer.buyerName}
                                    onChange={(e) => setNewBuyer({ ...newBuyer, buyerName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        placeholder="e.g. USA"
                                        value={newBuyer.country}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, country: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact">Contact Person</Label>
                                    <Input
                                        id="contact"
                                        placeholder="Name of POC"
                                        value={newBuyer.contactPerson}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, contactPerson: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="buyer@example.com"
                                        value={newBuyer.email}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+1..."
                                        value={newBuyer.phone}
                                        onChange={(e) => setNewBuyer({ ...newBuyer, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddBuyer} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                                {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                                Save Buyer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Buyer Records</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="relative mb-6">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                        <Input
                            placeholder="Search by buyer name or country..."
                            className="pl-10 h-10 border-muted-foreground/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Buyer Name</TableHead>
                                    <TableHead className="font-bold">Location</TableHead>
                                    <TableHead className="font-bold">Contact Details</TableHead>
                                    <TableHead className="font-bold text-center">Status</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-purple-500" />
                                            <p className="mt-2 text-sm text-muted-foreground font-medium">Loading buyer database...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredBuyers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-medium">
                                            No buyers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBuyers.map((buyer) => (
                                        <TableRow key={buyer.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-bold text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                                    {buyer.buyerName}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <IconWorld className="size-3.5 text-muted-foreground" />
                                                    {buyer.country}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{buyer.contactPerson}</span>
                                                    <span className="text-xs text-muted-foreground">{buyer.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                                                    Active
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-purple-600">Edit</Button>
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

export default function BuyerSetupPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <BuyerSetupContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
