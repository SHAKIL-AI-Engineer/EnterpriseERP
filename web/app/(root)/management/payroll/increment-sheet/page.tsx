"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconPlus,
    IconTrendingUp,
    IconArrowRight,
    IconSearch,
    IconLoader
} from "@tabler/icons-react"
import { payrollService, type SalaryIncrement } from "@/lib/services/payroll"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"

import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"

export default function IncrementSheetPage() {
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [isLoading, setIsLoading] = React.useState(false)
    const [records, setRecords] = React.useState<SalaryIncrement[]>([])

    React.useEffect(() => {
        handleSearch()
    }, [])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const data = await payrollService.getIncrements({
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId)
            })
            setRecords(data)
        } catch (error) {
            toast.error("Failed to load increment records")
        } finally {
            setIsLoading(false)
        }
    }

    const columns: ColumnDef<SalaryIncrement>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeName}</span>
        },
        {
            accessorKey: "previousGrossSalary",
            header: "Old Salary",
            cell: ({ row }) => <span className="text-muted-foreground">৳{row.original.previousGrossSalary.toLocaleString()}</span>
        },
        {
            accessorKey: "incrementAmount",
            header: "Increment",
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                    <IconPlus className="size-3" />
                    ৳{row.original.incrementAmount.toLocaleString()}
                </div>
            )
        },
        {
            accessorKey: "newGrossSalary",
            header: "New Salary",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconArrowRight className="size-3 text-muted-foreground" />
                    <span className="font-bold">৳{row.original.newGrossSalary.toLocaleString()}</span>
                </div>
            )
        },
        {
            accessorKey: "effectiveDate",
            header: "Effective Date",
            cell: ({ row }) => format(new Date(row.original.effectiveDate), "dd MMM yyyy")
        },
        {
            accessorKey: "incrementType",
            header: "Type",
            cell: ({ row }) => <Badge variant="secondary" className="font-normal text-xs">{row.original.incrementType}</Badge>
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Salary Increments</h1>
                    <p className="text-muted-foreground text-sm">View and manage salary increment history</p>
                </div>
                <Button className="gap-2">
                    <IconPlus className="size-4" />
                    Add Increment
                </Button>
            </div>

            <div className="px-6">
                <Card>
                    <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">Increment Records</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="whitespace-nowrap text-sm font-medium">Company</Label>
                                <ManagementLegacyCompanySelect
                                    value={selectedCompanyId}
                                    onChange={setSelectedCompanyId}
                                    allOptionLabel="Every Company"
                                    className="h-9 w-40"
                                />
                            </div>
                            <Button size="sm" variant="outline" className="h-9 px-3" onClick={handleSearch} disabled={isLoading}>
                                {isLoading ? <IconLoader className="size-4 animate-spin mr-2" /> : <IconSearch className="size-4 mr-2" />}
                                Sync
                            </Button>
                        </div>
                    </CardHeader>
                    <DataTable
                        columns={columns}
                        data={records}
                        showColumnCustomizer={false}
                        searchKey="employeeName"
                    />
                </Card>
            </div>
        </div>
    )
}
