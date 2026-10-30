"use client"

import * as React from "react"
import Link from "next/link"
import { IconTruckDelivery, IconPlus, IconPrinter, IconLoader2, IconExternalLink } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { GrnForm } from "@/components/store/grn-form"
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { Grn } from "@/lib/types/store"

const columns: ColumnDef<Grn>[] = [
    {
        accessorKey: "grnNo",
        header: "GRN No",
        cell: ({ row }) => (
            <Link href={`/store/grns/${row.original.id}`} className="font-mono font-bold text-primary hover:underline">
                {row.getValue("grnNo")}
            </Link>
        ),
    },
    {
        accessorKey: "grnDate",
        header: "Date",
        cell: ({ row }) => new Date(row.getValue("grnDate") as string).toLocaleDateString(),
    },
    {
        accessorKey: "supplier",
        header: "Supplier",
    },
    {
        accessorKey: "poReference",
        header: "Ref PO/Invoice",
        cell: ({ row }) => row.getValue("poReference") || "—",
    },
    {
        id: "itemsCount",
        header: "Items",
        cell: ({ row }) => <div className="text-center">{row.original.lines.length}</div>,
    },
    {
        accessorKey: "totalAmount",
        header: "Amount (৳)",
        cell: ({ row }) => {
            const amount = parseFloat(String(row.getValue("totalAmount")))
            const formatted = new Intl.NumberFormat("en-BD", {
                style: "currency",
                currency: "BDT",
                minimumFractionDigits: 0,
            }).format(amount)
            return <div className="font-bold text-right">{formatted}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" title="View GRN" asChild>
                    <Link href={`/store/grns/${row.original.id}`}>
                        <IconExternalLink className="size-4 text-muted-foreground" />
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" title="Print GRN">
                    <IconPrinter className="size-4 text-muted-foreground" />
                </Button>
            </div>
        ),
    },
]

function GrnPageContent({ companyId }: { companyId: string }) {
    const [data, setData] = React.useState<Grn[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);

    const fetchGrns = async () => {
        try {
            const grns = await storeService.getGrns(companyId);
            setData(grns);
        } catch {
            toast.error("Failed to load GRN records");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchGrns();
    }, [companyId]);

    const handleFormSubmit = async () => {
        await fetchGrns();
        setIsSheetOpen(false);
        toast.success("GRN created successfully");
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
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconTruckDelivery className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Goods Receive Notes (GRN)</h1>
                        <p className="text-sm text-muted-foreground">
                            Record and track incoming inventory and materials.
                        </p>
                    </div>
                </div>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <IconPlus className="mr-2 size-4" />
                    Create GRN
                </Button>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Create GRN"
                onAddClick={() => setIsSheetOpen(true)}
                searchKey="supplier"
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[900px] w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Create New GRN</SheetTitle>
                        <SheetDescription>
                            Enter details of the received goods.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <GrnForm
                            companyId={companyId}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

export default function GrnPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <GrnPageContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
