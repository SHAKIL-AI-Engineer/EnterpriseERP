"use client"

import * as React from "react"
import { IconCash, IconPlus } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DailyExpenseItem = {
    id: string
    date: string
    category: string
    description: string
    amount: number
    status: string
    paidBy: string
}

const columns: ColumnDef<DailyExpenseItem>[] = [
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
            <Badge variant="outline">{row.getValue("category")}</Badge>
        ),
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <div className="max-w-[300px] truncate" title={row.getValue("description")}>{row.getValue("description")}</div>,
    },
    {
        accessorKey: "paidBy",
        header: "Paid By",
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat("en-BD", {
                style: "currency",
                currency: "BDT",
                minimumFractionDigits: 2,
            }).format(amount)
            return <div className="font-bold text-right">{formatted}</div>
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
import { DailyExpenseForm } from "@/components/production/expense/daily-expense-form"
import { format } from "date-fns"

// ... existing items type and columns ...

const initialData: DailyExpenseItem[] = [
    {
        id: "EXP-2026-001",
        date: "Jan 30, 2026",
        category: "Raw Material",
        description: "Purchased 50kg of cotton for Line 01",
        amount: 25000,
        status: "Approved",
        paidBy: "Rahim Ahmed"
    },
    // ... rest of initial data defined previously ...
    {
        id: "EXP-2026-002",
        date: "Jan 30, 2026",
        category: "Transport",
        description: "Delivery truck fuel cost",
        amount: 4500,
        status: "Pending",
        paidBy: "Karim Uddin"
    },
    {
        id: "EXP-2026-003",
        date: "Jan 30, 2026",
        category: "Maintenance",
        description: "Sewing machine repair (Line 02)",
        amount: 1200,
        status: "Approved",
        paidBy: "Maintenance Team"
    },
    {
        id: "EXP-2026-004",
        date: "Jan 29, 2026",
        category: "Utilities",
        description: "Electricity bill partial payment",
        amount: 15000,
        status: "Approved",
        paidBy: "Accounts Dept"
    },
    {
        id: "EXP-2026-005",
        date: "Jan 29, 2026",
        category: "Snacks",
        description: "Evening snacks for overtime workers",
        amount: 850,
        status: "Pending",
        paidBy: "Line Supervisor"
    }
]

export default function DailyExpensePage() {
    const [data, setData] = React.useState<DailyExpenseItem[]>(initialData)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<DailyExpenseItem | null>(null)

    const handleAddClick = () => {
        setSelectedItem(null)
        setIsSheetOpen(true)
    }

    const handleEditClick = (item: DailyExpenseItem) => {
        // Convert date string back to Date object if needed, or pass as is if logic handles it
        // Our form expects Date object for 'date' field
        setSelectedItem(item)
        setIsSheetOpen(true)
    }

    const handleDeleteClick = (item: DailyExpenseItem) => {
        // In a real app this would call an API
        setData(prev => prev.filter(i => i.id !== item.id))
        toast.success("Expense deleted successfully")
    }

    const handleFormSubmit = (values: any) => {
        const formattedValues = {
            ...values,
            date: format(values.date, "MMM dd, yyyy"), // formatting date back to display string
        }

        if (selectedItem) {
            // Update
            setData(prev => prev.map(item => item.id === selectedItem.id ? { ...formattedValues, id: item.id } : item))
            toast.success("Expense updated successfully")
        } else {
            // Create
            const newItem = {
                ...formattedValues,
                id: `EXP-2026-${Math.floor(Math.random() * 1000)}`, // Mock ID
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
                        <IconCash className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Daily Expense</h1>
                        <p className="text-sm text-muted-foreground">
                            Track and manage daily production expenses.
                        </p>
                    </div>
                </div>
                <Button onClick={handleAddClick}>
                    <IconPlus className="mr-2 size-4" />
                    Add Expense
                </Button>
            </div>

            {/* Summary cards ... (keeping existing layout) */}
            <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Today's Total
                        </CardTitle>
                        <IconCash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳ 30,700.00</div>
                        <p className="text-xs text-muted-foreground">
                            +12% from yesterday
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Approval
                        </CardTitle>
                        <IconCash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳ 5,350.00</div>
                        <p className="text-xs text-muted-foreground">
                            2 transactions pending
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            This Week
                        </CardTitle>
                        <IconCash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳ 145,200.00</div>
                        <p className="text-xs text-muted-foreground">
                            +4% from last week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg. Daily
                        </CardTitle>
                        <IconCash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳ 24,200.00</div>
                        <p className="text-xs text-muted-foreground">
                            Based on last 30 days
                        </p>
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
                searchKey="description"
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{selectedItem ? "Edit Expense" : "Add New Expense"}</SheetTitle>
                        <SheetDescription>
                            {selectedItem ? "Update the details of the expense record." : "Create a new daily expense record."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <DailyExpenseForm
                            initialData={selectedItem ? {
                                date: new Date(selectedItem.date),
                                category: selectedItem.category,
                                description: selectedItem.description,
                                amount: selectedItem.amount,
                                paidBy: selectedItem.paidBy,
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
