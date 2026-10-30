"use client"

import * as React from "react"
import { IconCash, IconPlus, IconReceipt } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type OtherExpenseItem = {
    id: string
    date: string
    title: string
    category: string
    amount: number
    status: string
    requestBy: string
}

const columns: ColumnDef<OtherExpenseItem>[] = [
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "title",
        header: "Expense Title",
        cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
    },
    {
        accessorKey: "requestBy",
        header: "Requested By",
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            return <div className="font-bold text-right">৳ {amount.toLocaleString('en-BD')}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Approved" ? "default" : status === "Rejected" ? "destructive" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
]

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { OthersExpenseForm } from "@/components/production/expense/others-expense-form"
import { format } from "date-fns"

// ... types and columns ...

const initialData: OtherExpenseItem[] = [
    {
        id: "OEXP-2026-001",
        date: "Jan 28, 2026",
        title: "Guest Entertainment",
        category: "Entertainment",
        amount: 3500,
        status: "Approved",
        requestBy: "Md. Rafiq"
    },
    // ... rest of data ...
    {
        id: "OEXP-2026-002",
        date: "Jan 25, 2026",
        title: "Office Decor",
        category: "Miscellaneous",
        amount: 12000,
        status: "Pending",
        requestBy: "Office Admin"
    },
    {
        id: "OEXP-2026-003",
        date: "Jan 22, 2026",
        title: "Team Lunch",
        category: "Welfare",
        amount: 8500,
        status: "Approved",
        requestBy: "Production Manager"
    },
    {
        id: "OEXP-2026-004",
        date: "Jan 18, 2026",
        title: "Emergency Medkit",
        category: "Medical",
        amount: 2500,
        status: "Approved",
        requestBy: "Safety Officer"
    },
    {
        id: "OEXP-2026-005",
        date: "Jan 15, 2026",
        title: "Stationery Supplies",
        category: "Office Supplies",
        amount: 4500,
        status: "Approved",
        requestBy: "Store Keeper"
    }
]

export default function OthersExpensePage() {
    const [data, setData] = React.useState<OtherExpenseItem[]>(initialData)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<OtherExpenseItem | null>(null)

    const handleAddClick = () => {
        setSelectedItem(null)
        setIsSheetOpen(true)
    }

    const handleEditClick = (item: OtherExpenseItem) => {
        setSelectedItem(item)
        setIsSheetOpen(true)
    }

    const handleDeleteClick = (item: OtherExpenseItem) => {
        setData(prev => prev.filter(i => i.id !== item.id))
        toast.success("Expense record deleted")
    }

    const handleFormSubmit = (values: any) => {
        const formattedValues = {
            ...values,
            date: format(values.date, "MMM dd, yyyy"),
        }

        if (selectedItem) {
            setData(prev => prev.map(item => item.id === selectedItem.id ? { ...formattedValues, id: item.id } : item))
            toast.success("Expense updated successfully")
        } else {
            const newItem = {
                ...formattedValues,
                id: `OEXP-2026-${Math.floor(Math.random() * 1000)}`,
            }
            setData(prev => [newItem, ...prev])
            toast.success("Expense added successfully")
        }
        setIsSheetOpen(false)
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconReceipt className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Others Expense</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage miscellaneous and ad-hoc production expenses.
                        </p>
                    </div>
                </div>
                <Button onClick={handleAddClick}>
                    <IconPlus className="mr-2 size-4" />
                    Add Expense
                </Button>
            </div>

            {/* Summary Cards - kept as is */}
            <div className="grid gap-4 px-4 md:grid-cols-3 lg:px-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Miscellaneous Total</CardTitle>
                        <IconCash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳ 31,000</div>
                        <p className="text-xs text-muted-foreground">This Month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <IconReceipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Requires Approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Largest Category</CardTitle>
                        <IconReceipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Miscellaneous</div>
                        <p className="text-xs text-muted-foreground">৳ 12,000 spending</p>
                    </CardContent>
                </Card>
            </div>


            <DataTable
                data={data}
                columns={columns}
                addLabel="Add Expense"
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDelete={handleDeleteClick}
                searchKey="title"
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{selectedItem ? "Edit Form" : "New Expense Request"}</SheetTitle>
                        <SheetDescription>
                            Enter details for miscellaneous expense.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <OthersExpenseForm
                            initialData={selectedItem ? {
                                date: new Date(selectedItem.date),
                                title: selectedItem.title,
                                category: selectedItem.category,
                                amount: selectedItem.amount,
                                requestBy: selectedItem.requestBy,
                                status: selectedItem.status
                            } : undefined}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
