"use client"

import * as React from "react"
import { IconBoxSeam, IconLoader2 } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { StoreItem } from "@/lib/types/store"
import { toast } from "sonner"

type InventoryRow = {
    id: string
    name: string
    category: string
    code: string
    quantity: number
    unit: string
    reorderLevel: number
    status: string
}

const columns: ColumnDef<InventoryRow>[] = [
    {
        accessorKey: "code",
        header: "Item Code",
        cell: ({ row }) => <div className="font-mono text-xs font-medium">{row.getValue("code")}</div>,
    },
    {
        accessorKey: "name",
        header: "Item Name",
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "quantity",
        header: "Stock",
        cell: ({ row }) => <div>{row.getValue("quantity")} {row.original.unit}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "In Stock" ? "default" : status === "Low Stock" ? "destructive" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

function mapItems(items: StoreItem[]): InventoryRow[] {
    return items.map(item => ({
        id: item.id,
        name: item.itemName,
        category: item.categoryName ?? "—",
        code: item.itemCode,
        quantity: item.currentStock,
        unit: item.unitName ?? "",
        reorderLevel: item.minimumStockLevel,
        status: item.currentStock <= item.minimumStockLevel ? "Low Stock" : "In Stock",
    }));
}

function InventoryContent({ companyId }: { companyId: string }) {
    const [data, setData] = React.useState<InventoryRow[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchItems = async () => {
            try {
                const items = await storeService.getItems(companyId);
                setData(mapItems(items));
            } catch {
                toast.error("Failed to load inventory");
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [companyId]);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <IconLoader2 className="animate-spin size-8 text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconBoxSeam className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Stock List</h1>
                    <p className="text-sm text-muted-foreground">
                        Master inventory of all materials and assets.
                    </p>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Add Item"
                onAddClick={() => { window.location.href = "/store/master/item-setup"; }}
                onEditClick={() => { window.location.href = "/store/master/item-setup"; }}
                onDelete={() => toast.info("Delete from Item Setup")}
                showTabs={true}
            />
        </>
    );
}

export default function InventoryPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <InventoryContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
