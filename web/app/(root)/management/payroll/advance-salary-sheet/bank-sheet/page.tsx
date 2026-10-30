"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconBuildingBank, IconFileSpreadsheet, IconLoader } from "@tabler/icons-react"
import { payrollService } from "@/lib/services/payroll"
import { companyService } from "@/lib/services/company"
import { toast } from "sonner"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"

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

export default function AdvanceSalaryBankSheetPage() {
    const router = useRouter()
    const [isExporting, setIsExporting] = React.useState(false)
    const [companies, setCompanies] = React.useState<any[]>([])

    const [filters, setFilters] = React.useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        companyId: "all",
    })

    React.useEffect(() => {
        companyService.getAll().then(setCompanies).catch(console.error)
    }, [])

    const handleExportExcel = async () => {
        setIsExporting(true)
        try {
            await payrollService.exportAdvanceBankSheet({
                year: filters.year,
                month: filters.month,
                companyId: filters.companyId === "all" ? undefined : parseInt(filters.companyId)
            })
            toast.success("Bank sheet exported successfully")
        } catch (error) {
            toast.error("Failed to export bank sheet")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-500 px-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push("/management/payroll/advance-salary-sheet")} className="text-gray-500 hover:text-gray-900 bg-white border-gray-200 shadow-sm hover:bg-gray-50 rounded-xl size-10">
                    <IconArrowLeft className="size-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Advance Bank Sheet</h1>
                    <p className="text-muted-foreground text-sm mt-1">Generate and export multi-sheet Excel files for bank payments</p>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-purple-900/5 bg-white overflow-hidden rounded-2xl">
                 <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-100 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-purple-100">
                        <IconBuildingBank className="size-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-purple-900">Export Parameters</h2>
                        <p className="text-sm border-purple-600/60 text-purple-700/80">Select parameters to download the Excel template with Summary, mCash and Card sheets.</p>
                    </div>
                 </div>

                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 tracking-wider uppercase">Repayment Month</Label>
                            <NativeSelect
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all rounded-xl cursor-pointer"
                            >
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 tracking-wider uppercase">Repayment Year</Label>
                            <NativeSelect
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all rounded-xl cursor-pointer"
                            >
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 tracking-wider uppercase">Filter by Company</Label>
                            <NativeSelect
                                value={filters.companyId}
                                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all rounded-xl cursor-pointer"
                            >
                                <option value="all">Every Company</option>
                                {companies.map(c => <option key={c.id} value={c.id.toString()}>{c.companyNameEn}</option>)}
                            </NativeSelect>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100 border-dashed flex justify-end">
                        <Button
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="bg-[#107C41] hover:bg-[#0C6133] text-white font-medium shadow-lg shadow-green-600/20 gap-2 px-8 h-12 rounded-xl text-base transition-all active:scale-[0.98]"
                        >
                            {isExporting ? <IconLoader className="size-5 animate-spin" /> : <IconFileSpreadsheet className="size-5" />}
                            Generate Excel Sheet
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
