"use client"

import * as React from "react"
import { IconChartBar, IconDownload } from "@tabler/icons-react"
import { Plus } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"

type MonthlyExpenseItem = {
    id: string
    month: string
    year: number
    totalExpense: number
    materialCost: number
    laborCost: number
    overheadCost: number
    status: string
}

const columns: ColumnDef<MonthlyExpenseItem>[] = [
    {
        accessorKey: "month",
        header: "Month",
        cell: ({ row }) => <div className="font-medium">{row.getValue("month")} {row.original.year}</div>,
    },
    {
        accessorKey: "materialCost",
        header: "Material Cost",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("materialCost"))
            return <div className="text-right">৳ {amount.toLocaleString('en-BD')}</div>
        },
    },
    {
        accessorKey: "laborCost",
        header: "Labor Cost",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("laborCost"))
            return <div className="text-right">৳ {amount.toLocaleString('en-BD')}</div>
        },
    },
    {
        accessorKey: "overheadCost",
        header: "Overhead",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("overheadCost"))
            return <div className="text-right">৳ {amount.toLocaleString('en-BD')}</div>
        },
    },
    {
        accessorKey: "totalExpense",
        header: "Total Expense",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalExpense"))
            return <div className="font-bold text-right text-primary">৳ {amount.toLocaleString('en-BD')}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Finalized" ? "default" : "outline"}>
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
import { MonthlyExpenseForm } from "@/components/production/expense/monthly-expense-form"

// ... types and columns ...

const initialData: MonthlyExpenseItem[] = [
    {
        id: "MEXP-2026-01",
        month: "January",
        year: 2026,
        totalExpense: 1250000,
        materialCost: 750000,
        laborCost: 350000,
        overheadCost: 150000,
        status: "Provisional"
    },
    // ... rest of data ...
    {
        id: "MEXP-2025-12",
        month: "December",
        year: 2025,
        totalExpense: 1180000,
        materialCost: 700000,
        laborCost: 340000,
        overheadCost: 140000,
        status: "Finalized"
    },
    {
        id: "MEXP-2025-11",
        month: "November",
        year: 2025,
        totalExpense: 1150000,
        materialCost: 680000,
        laborCost: 330000,
        overheadCost: 140000,
        status: "Finalized"
    },
    {
        id: "MEXP-2025-10",
        month: "October",
        year: 2025,
        totalExpense: 1200000,
        materialCost: 710000,
        laborCost: 345000,
        overheadCost: 145000,
        status: "Finalized"
    },
    {
        id: "MEXP-2025-09",
        month: "September",
        year: 2025,
        totalExpense: 1120000,
        materialCost: 650000,
        laborCost: 335000,
        overheadCost: 135000,
        status: "Finalized"
    }
]

export default function MonthlyExpensePage() {
    const [data, setData] = React.useState<MonthlyExpenseItem[]>(initialData)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<MonthlyExpenseItem | null>(null)

    const handleAddClick = () => {
        setSelectedItem(null)
        setIsSheetOpen(true)
    }

    const handleEditClick = (item: MonthlyExpenseItem) => {
        setSelectedItem(item)
        setIsSheetOpen(true)
    }

    const handleDeleteClick = (item: MonthlyExpenseItem) => {
        setData(prev => prev.filter(i => i.id !== item.id))
        toast.success("Record deleted")
    }

    const handleFormSubmit = (values: any) => {
        if (selectedItem) {
            setData(prev => prev.map(item => item.id === selectedItem.id ? { ...values, id: item.id } : item))
            toast.success("Expense updated successfully")
        } else {
            const newItem = {
                ...values,
                id: `MEXP-${values.year}-${Math.floor(Math.random() * 1000)}`,
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
                        <IconChartBar className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Monthly Expense</h1>
                        <p className="text-sm text-muted-foreground">
                            Analyze expense trends and monthly breakdowns.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => toast.info("Downloading Report...")}>
                        <IconDownload className="mr-2 size-4" />
                        Export
                    </Button>
                    <Button onClick={handleAddClick}>
                        <Plus className="mr-2 size-4" />
                        Add Record
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 px-4 lg:px-6">
                {/* Reusing the interactive chart component - in a real app this would be customized with expense data */}
                <ChartAreaInteractive />
            </div>

            <DataTable
                data={data}
                columns={columns}
                addLabel="Add Record"
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDelete={handleDeleteClick}
                showActions={true}
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{selectedItem ? "Edit Record" : "New Monthly Record"}</SheetTitle>
                        <SheetDescription>
                            Enter monthly expense details.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <MonthlyExpenseForm
                            initialData={selectedItem || undefined}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
