"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
    IconArrowLeft,
    IconLoader,
    IconPrinter,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { leaveService, type BackendLeaveBalance } from "@/lib/services/leave"
import { enrichApplication, type LeaveApplicationView } from "@/lib/services/leave-helpers"
import { toast } from "sonner"
import { format } from "date-fns"
export default function LeaveApplicationExportPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const componentRef = React.useRef<HTMLDivElement>(null)

    const [application, setApplication] = React.useState<LeaveApplicationView | null>(null)
    const [balances, setBalances] = React.useState<BackendLeaveBalance[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const app = await leaveService.getLeaveApplicationById(id)
                const view = await enrichApplication(app, app.companyId)
                setApplication(view)
                const balanceData = await leaveService.getEmployeeBalances(app.employeeId, {
                    companyId: app.companyId,
                    year: new Date().getFullYear(),
                })
                setBalances(balanceData)
            } catch {
                toast.error("Failed to load data")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <IconLoader className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!application) return null

    // Helper for table data
    const getLeaveBalance = (typeName: string) => {
        const found = balances.find((b) => {
            const name = (b.leaveName || b.leaveCode || "").toLowerCase()
            return name.includes(typeName.toLowerCase())
        })
        return found
            ? { totalAllocated: found.entitledDays, totalTaken: found.usedDays, balance: found.balanceDays }
            : { totalAllocated: 0, totalTaken: 0, balance: 0 }
    }

    const casualLeave = getLeaveBalance("Casual")
    const sickLeave = getLeaveBalance("Sick")
    const earnedLeave = getLeaveBalance("Earned")
    const maternityLeave = getLeaveBalance("Maternity")

    return (
        <div className="flex flex-col gap-6 py-6 max-w-[210mm] mx-auto animate-in fade-in duration-500">
            {/* Controls - Hidden on Print */}
            <div className="flex items-center justify-between px-4 print:hidden">
                <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                    <IconArrowLeft className="size-4" />
                    Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handlePrint}>
                        <IconPrinter className="size-4" />
                        Print / Save PDF
                    </Button>
                </div>
            </div>

            {/* A4 Paper Component */}
            <div ref={componentRef} className="bg-white text-black p-[15mm] shadow-lg print:shadow-none min-h-[297mm] ring-1 ring-muted-foreground/10 print:ring-0 font-['SutonnyMJ'] text-xl leading-snug">
                <style jsx global>{`
                    @font-face {
                        font-family: 'SutonnyMJ';
                        src: url('/fonts/SutonnyMJ.ttf') format('truetype');
                    }
                    @media print {
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        body {
                            background: white;
                        }
                    }
                    .bangla-dotted-line {
                        border-bottom: 1px dotted #000;
                        display: inline-block;
                        min-width: 100px;
                        padding-bottom: 1px;
                        margin-bottom: -1px;
                    }
                    .bangla-box {
                        border: 1px solid #000;
                        width: 130px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 22px;
                    }
                    .header-logo {
                        width: 50px;
                        height: 50px;
                        background: #333;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: sans-serif;
                        font-weight: bold;
                        font-size: 30px;
                        border-radius: 4px;
                        margin-right: 15px;
                    }
                `}</style>

                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center mb-1">
                        <div className="header-logo">E</div>
                        <h1 className="text-4xl font-bold">BDWwbwU d¨vewiK Bdvóªiz wjwgfUW</h1>
                    </div>
                    <p className="text-2xl">evnv`yiæi,wgR©vcyi evRvi, MvRxcyi |</p>
                    <h2 className="text-3xl font-bold underline mt-2">QzwUi Avf`bcf</h2>
                </div>

                {/* Date */}
                <div className="flex justify-end mb-6">
                    <p className="text-2xl">Zvs: <span className="bangla-dotted-line min-w-[200px] text-center">{format(new Date(application.appliedDate), "dd/MM/yyyy")}</span></p>
                </div>

                {/* Personal Info */}
                <div className="space-y-4 mb-2">
                    <div className="flex gap-4">
                        <p className="flex-1">bvg : <span className="bangla-dotted-line flex-1 pl-2">{application.employeeName}</span></p>
                        <p className="flex-1">c`ex : <span className="bangla-dotted-line flex-1 pl-2">{application.designation}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <p className="flex-1">fcKkb/jvBb : <span className="bangla-dotted-line flex-1 pl-2">{application.department}</span></p>
                        <p className="flex-1">KvW© bs: <span className="bangla-dotted-line flex-1 pl-2">{application.employeeId}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <p className="flex-1">QzwUi KviY: <span className="bangla-dotted-line flex-1 pl-2">{application.reason}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <p>QzwUi ZvwiL : <span className="bangla-dotted-line min-w-[150px] text-center">{format(new Date(application.startDate), "dd/MM/yyyy")}</span></p>
                        <p>cvfK : <span className="bangla-dotted-line min-w-[150px] text-center">{format(new Date(application.endDate), "dd/MM/yyyy")}</span></p>
                        <p>ch©šÍ</p>
                    </div>
                    <div className="flex gap-4">
                        <p>fguvU : <span className="bangla-dotted-line min-w-[60px] text-center">{application.totalDays}</span></p>
                        <p>w`fbi QzwU gÄzi Kivi swebq Avf`eb KiwQ |</p>
                    </div>
                </div>

                <div className="mt-8">
                    <p>QzwUf_ _vKvKvjxb wVKvbv : <span className="bangla-dotted-line w-full block mt-4 border-b-2"></span></p>
                    <p className="bangla-dotted-line w-full block mt-4 border-b-2"></p>
                </div>

                <div className="flex justify-between mt-12 items-end">
                    <div className="flex gap-2">
                        <p>fdvbe : <span className="bangla-dotted-line min-w-[250px]"></span></p>
                    </div>
                    <div className="text-center">
                        <p className="bangla-dotted-line min-w-[220px] mb-1"></p>
                        <p>Avf`ebKvixi ív²i</p>
                    </div>
                </div>

                <div className="border-b-[1.5px] border-dashed border-black w-full my-8"></div>

                {/* Office Section */}
                <div className="text-center mb-6">
                    <p className="text-2xl font-bold font-sans">GB Ask Awdm KZ©…K c~iY Kiv nfe</p>
                </div>

                <div className="flex gap-8 mb-6">
                    <p className="flex items-center gap-2">PvKzwi fZ f`vM`v fbi ZvwiL: <div className="bangla-box"></div></p>
                    <p className="flex items-center gap-2">QzwUi wnmveKvj: <div className="bangla-box"></div></p>
                    <p className="flex items-center gap-2">nBfZ: <div className="bangla-box"></div></p>
                </div>

                {/* Statistics Table */}
                <table className="w-full border-collapse mb-8 text-2xl">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 text-left w-1/4">QzwUi weeiY</th>
                            <th className="border border-black p-2 text-center text-xl font-bold">fbwgvwËK QzwU</th>
                            <th className="border border-black p-2 text-center text-xl font-bold">cxov-QzwU</th>
                            <th className="border border-black p-2 text-center text-xl font-bold">AwR©Z QzwU</th>
                            <th className="border border-black p-2 text-center text-xl font-bold">gvZ…Z¡RwbZ QzwU</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black p-2">cvc¨ QzwU :</td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{casualLeave.totalAllocated || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{sickLeave.totalAllocated || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{earnedLeave.totalAllocated || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{maternityLeave.totalAllocated || ""}</div></td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2">f fvvMÜ QzwU :</td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{casualLeave.totalTaken || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{sickLeave.totalTaken || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{earnedLeave.totalTaken || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{maternityLeave.totalTaken || ""}</div></td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2">Aewff QzwU :</td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{casualLeave.balance || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{sickLeave.balance || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{earnedLeave.balance || ""}</div></td>
                            <td className="border border-black p-2"><div className="w-full h-8 flex items-center justify-center">{maternityLeave.balance || ""}</div></td>
                        </tr>
                    </tbody>
                </table>

                <div className="flex gap-4 items-center mb-10">
                    <div className="bangla-box w-[200px]"></div>
                    <p>w`fbi fbwgvwËK/ cxov/ AwR©Z/ gvZ… Z¡ RwbZ QzwU gÄzi Kiv nBj |</p>
                </div>

                {/* Approvals */}
                <div className="flex justify-between items-start text-xl border-t border-black pt-2 font-bold mb-4 px-2">
                    <p>GBP Avi kvLv</p>
                    <p>BbPvR©</p>
                    <p>GwcGg/wcGg/wKDwm Gg</p>
                    <p>wefvMxq cÖavb</p>
                    <p>wefvMxq cÖavb (cÖkvmb)</p>
                    <p>wR Gg</p>
                </div>

                <div className="border-b-[1.5px] border-dashed border-black w-full my-6"></div>

                {/* Footer Section */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold">BDWwbwU d¨vewiK Bdv bs wj</h2>
                    <p className="text-xl underline">QzwU f_f_ Kvfe f fvvM`v f bi cÖwZf f`b</p>
                </div>

                <div className="space-y-4 text-xl">
                    <div className="flex gap-4">
                        <p className="flex-1">bvg : <span className="bangla-dotted-line flex-1 pl-2">{application.employeeName}</span></p>
                        <p className="flex-1">KvW© bs: <span className="bangla-dotted-line flex-1 pl-2">{application.employeeId}</span></p>
                        <p className="flex-1">Bm¨zi ZvwiL : <span className="bangla-dotted-line flex-1 pl-2"></span></p>
                    </div>
                    <div>
                        <p>gÄziK…Z QzwU Abyhvqx f`vM`v fbi ZvwiL : <span className="bangla-dotted-line min-w-[300px]"></span></p>
                    </div>
                    <div>
                        <p>f`vM`v fbi cÖK…Z ZvwiL : <span className="bangla-dotted-line min-w-[300px]"></span></p>
                    </div>
                </div>

                <div className="flex justify-between mt-12 items-end">
                    <div className="text-center">
                        <p className="bangla-dotted-line min-w-[200px] mb-1"></p>
                        <p>Avf`ebKvixi ív²i</p>
                    </div>
                    <div className="text-center max-w-[400px]">
                        <p className="text-lg">GB Ask_f_ QzwU f_f_ Kvfe f fvvM`v fbi mgq cÖkvmb kvLvq Rgv w`fZ nfe |</p>
                    </div>
                    <div className="text-center">
                        <p className="bangla-dotted-line min-w-[200px] mb-1"></p>
                        <p>GBP Avi kvLv</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
