"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconSearch, IconLoader, IconRotateClockwise, IconFileExport } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { payrollService, type AdvanceSalarySummary } from "@/lib/services/payroll"
import { companyService } from "@/lib/services/company"
import { toast } from "sonner"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const MONTHS = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }
]

export default function AdvanceSalarySummaryPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isExporting, setIsExporting] = React.useState(false)
    const [companies, setCompanies] = React.useState<any[]>([])
    const [summary, setSummary] = React.useState<AdvanceSalarySummary | null>(null)

    const [filters, setFilters] = React.useState({
        companyId: "all",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    })

    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                const cmp = await companyService.getAll()
                setCompanies(cmp)
                handleSearch()
            } catch (error) {
                console.error("Failed to load companies", error)
            }
        }
        loadInitialData()
    }, [])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const result = await payrollService.getAdvanceSalarySummary({
                companyId: filters.companyId === "all" ? undefined : parseInt(filters.companyId),
                month: filters.month,
                year: filters.year
            })
            setSummary(result)
        } catch (error) {
            toast.error("Failed to load summary data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            await payrollService.exportAdvanceSalarySummary({
                companyId: filters.companyId === "all" ? undefined : parseInt(filters.companyId),
                month: filters.month,
                year: filters.year
            })
            toast.success("Excel summary exported successfully")
        } catch (error) {
            toast.error("Failed to export summary")
        } finally {
            setIsExporting(false)
        }
    }

    const resetFilters = () => {
        setFilters({
            companyId: "all",
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        })
    }

    const getColumns = (type: 'department' | 'section' | 'line' | 'designation') => {
        const nameKey = type === 'department' ? 'departmentName' : type === 'section' ? 'sectionName' : type === 'line' ? 'lineName' : 'designationName';
        const label = type === 'department' ? 'Department' : type === 'section' ? 'Section' : type === 'line' ? 'Line' : 'Designation';

        return [
            {
                id: "sl",
                header: "SL",
                cell: ({ row }: any) => <span className="text-xs font-medium text-gray-500">{row.index + 1}</span>,
            },
            {
                accessorKey: nameKey,
                header: label,
                cell: ({ row }: any) => <span className="font-bold text-gray-800 text-xs">{row.original[nameKey]}</span>
            },
            {
                accessorKey: "employeeCount",
                header: "Emp",
                cell: ({ row }: any) => <div className="text-center font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{row.original.employeeCount}</div>
            },
            {
                accessorKey: "basicSalary",
                header: "Basic",
                cell: ({ row }: any) => <div className="text-right text-xs font-medium">{(row.original.basicSalary ?? 0).toLocaleString()}</div>
            },
            {
                accessorKey: "grossSalary",
                header: "Gross",
                cell: ({ row }: any) => <div className="text-right text-xs font-bold text-gray-900">{(row.original.grossSalary ?? 0).toLocaleString()}</div>
            },
            {
                accessorKey: "absentDays",
                header: "Abs",
                cell: ({ row }: any) => <div className="text-center text-xs text-red-600 font-medium">{row.original.absentDays ?? 0}</div>
            },
            {
                accessorKey: "absentDeduction",
                header: "Abs.Ded",
                cell: ({ row }: any) => <div className="text-right text-xs font-medium text-red-600">{(row.original.absentDeduction ?? 0).toLocaleString()}</div>
            },
            {
                accessorKey: "totalPayableWages",
                header: "Payable",
                cell: ({ row }: any) => <div className="text-right text-xs font-bold text-indigo-700">{(row.original.totalPayableWages ?? 0).toLocaleString()}</div>
            },
            {
                accessorKey: "otHours",
                header: "OT Hr",
                cell: ({ row }: any) => <div className="text-center text-xs font-medium">{row.original.otHours ?? 0}</div>
            },
            {
                accessorKey: "otAmount",
                header: "OT Pay",
                cell: ({ row }: any) => <div className="text-right text-xs font-medium text-green-700">{(row.original.otAmount ?? 0).toLocaleString()}</div>
            },
            {
                accessorKey: "netPayable",
                header: "Net Pay",
                cell: ({ row }: any) => <div className="text-right text-sm font-black text-gray-950 bg-gray-50 px-2 py-0.5 rounded shadow-sm">৳{(row.original.netPayable ?? 0).toLocaleString()}</div>
            }
        ];
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-blue-50 transition-colors">
                    <IconArrowLeft className="size-5 text-blue-600" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Advance Salary Summary</h1>
                    <p className="text-muted-foreground text-sm">Aggregated breakdown by various categories</p>
                </div>
                <div className="ml-auto">
                    <Button 
                        onClick={handleExport}
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 text-white border-none gap-2"
                        disabled={isExporting}
                    >
                        {isExporting ? <IconLoader className="size-4 animate-spin" /> : <IconFileExport className="size-5" />}
                        Export Excel
                    </Button>
                </div>
            </div>

            <Card className="border shadow-sm">
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Company</Label>
                        <NativeSelect
                            value={filters.companyId}
                            onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                            className="h-10 text-sm"
                        >
                            <option value="all">Every Company</option>
                            {companies.map(c => <option key={c.id} value={c.id.toString()}>{c.companyNameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Month</Label>
                        <NativeSelect
                            value={filters.month.toString()}
                            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                            className="h-10 text-sm"
                        >
                            {MONTHS.map(m => <option key={m.value} value={m.value.toString()}>{m.label}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Year</Label>
                        <NativeSelect
                            value={filters.year.toString()}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                            className="h-10 text-sm"
                        >
                            {Array.from({ length: 5 }).map((_, i) => {
                                const yr = new Date().getFullYear() - 2 + i;
                                return <option key={yr} value={yr.toString()}>{yr}</option>;
                            })}
                        </NativeSelect>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={handleSearch}
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-5" />}
                            Apply Search
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Disbursed</p>
                    <p className="text-xl font-black text-blue-900">৳{summary?.totalAdvanceDisbursed.toLocaleString() || "0"}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Pending</p>
                    <p className="text-xl font-black text-orange-900">৳{summary?.totalPendingAmount.toLocaleString() || "0"}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Repaid</p>
                    <p className="text-xl font-black text-green-900">৳{summary?.totalRepaid.toLocaleString() || "0"}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Employees</p>
                    <p className="text-xl font-black text-indigo-900">{summary?.totalEmployees || 0}</p>
                </div>
            </div>

            <Tabs defaultValue="department" className="w-full">
                <TabsList className="bg-gray-100 p-1 rounded-lg mb-4 flex h-10 w-fit">
                    <TabsTrigger value="department" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase">Department</TabsTrigger>
                    <TabsTrigger value="section" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase">Section</TabsTrigger>
                    <TabsTrigger value="line" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase">Line</TabsTrigger>
                    <TabsTrigger value="designation" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase">Designation</TabsTrigger>
                </TabsList>

                <TabsContent value="department">
                    <Card className="border shadow-none overflow-hidden">
                        <DataTable
                            columns={getColumns('department') as any}
                            data={(summary?.departmentSummaries || []) as any[]}
                            searchKey="departmentName"
                            showColumnCustomizer={false}
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="section">
                    <Card className="border shadow-none overflow-hidden">
                        <DataTable
                            columns={getColumns('section') as any}
                            data={(summary?.sectionSummaries || []) as any[]}
                            searchKey="sectionName"
                            showColumnCustomizer={false}
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="line">
                    <Card className="border shadow-none overflow-hidden">
                        <DataTable
                            columns={getColumns('line') as any}
                            data={(summary?.lineSummaries || []) as any[]}
                            searchKey="lineName"
                            showColumnCustomizer={false}
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="designation">
                    <Card className="border shadow-none overflow-hidden">
                        <DataTable
                            columns={getColumns('designation') as any}
                            data={(summary?.designationSummaries || []) as any[]}
                            searchKey="designationName"
                            showColumnCustomizer={false}
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
