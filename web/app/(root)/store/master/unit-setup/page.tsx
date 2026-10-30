"use client"

import * as React from "react"
import { IconScale, IconPlus, IconLoader2 } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { StoreUnit, CreateStoreUnitRequest } from "@/lib/types/store"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

function UnitSetupContent({ companyId }: { companyId: string }) {
    const [units, setUnits] = React.useState<StoreUnit[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [newUnit, setNewUnit] = React.useState<Omit<CreateStoreUnitRequest, "companyId">>({
        unitName: "",
        shortName: "",
        unitType: "Count",
    });

    const fetchUnits = async () => {
        try {
            const data = await storeService.getUnits(companyId);
            setUnits(data);
        } catch {
            toast.error("Failed to load units");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUnits();
    }, [companyId]);

    const handleAddUnit = async () => {
        if (!newUnit.unitName || !newUnit.shortName) {
            toast.error("Unit name and abbreviation are required");
            return;
        }

        setSubmitting(true);
        try {
            await storeService.addUnit({ ...newUnit, companyId });
            toast.success("Unit created successfully");
            setIsDialogOpen(false);
            setNewUnit({ unitName: "", shortName: "", unitType: "Count" });
            fetchUnits();
        } catch {
            toast.error("Failed to create unit");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        <IconScale className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Unit Setup</h1>
                        <p className="text-muted-foreground text-sm">Define units of measurement (UoM) for your store items.</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white border-none">
                            <IconPlus className="size-4" /> Add Unit
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Unit</DialogTitle>
                            <DialogDescription>Define a standard measurement unit.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Unit Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Kilogram"
                                        value={newUnit.unitName}
                                        onChange={(e) => setNewUnit({ ...newUnit, unitName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="short">Abbreviation</Label>
                                    <Input
                                        id="short"
                                        placeholder="e.g. kg"
                                        value={newUnit.shortName}
                                        onChange={(e) => setNewUnit({ ...newUnit, shortName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Measurement Type</Label>
                                <Select
                                    value={newUnit.unitType ?? "Count"}
                                    onValueChange={(val) => setNewUnit({ ...newUnit, unitType: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Weight">Weight</SelectItem>
                                        <SelectItem value="Count">Count</SelectItem>
                                        <SelectItem value="Volume">Volume</SelectItem>
                                        <SelectItem value="Length">Length</SelectItem>
                                        <SelectItem value="Area">Area</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddUnit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                                {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                                Save Unit
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Standard Units</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border bg-card overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="font-bold">Unit Name</TableHead>
                                    <TableHead className="font-bold">Short Name</TableHead>
                                    <TableHead className="font-bold">Type</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center">
                                            <IconLoader2 className="animate-spin size-8 mx-auto text-amber-500" />
                                            <p className="mt-2 text-sm font-medium text-amber-600">Loading units...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : units.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium">
                                            No units defined. Click &quot;Add Unit&quot; to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    units.map((unit) => (
                                        <TableRow key={unit.id} className="hover:bg-muted/30 transition-shadow">
                                            <TableCell className="font-semibold text-foreground">{unit.unitName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-amber-700 bg-amber-50 dark:bg-amber-900/10 dark:text-amber-400 border-amber-200 dark:border-amber-900/40">
                                                    {unit.shortName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 border-none px-3 font-medium">
                                                    {unit.unitType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-amber-600">Edit</Button>
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

export default function UnitSetupPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <UnitSetupContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
