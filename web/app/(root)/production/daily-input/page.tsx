"use client"

import * as React from "react"
import {
    IconCalendar,
    IconClock,
    IconDeviceFloppy,
    IconRefresh,
    IconTarget,
    IconChartBar,
    IconUser,
    IconFilter,
    IconPlus,
    IconSearch,
    IconLayoutGrid,
    IconArrowRight,
    IconShirt,
    IconBuildingFactory2,
    IconReload,
    IconHistory,
    IconBox,
    IconFileSpreadsheet,
    IconTrash
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { productionAssignmentService, DailyReportItem, DailyProductionRecord, ProductionAssignment } from "@/lib/services/production-assignment"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { DatePicker } from "@/components/ui/date-picker"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DailyProductionInputPage() {
    const [isLoading, setIsLoading] = React.useState(true)
    const [reportItems, setReportItems] = React.useState<DailyReportItem[]>([])
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
    
    // Filter state
    const [showFilters, setShowFilters] = React.useState(false)
    const [filters, setFilters] = React.useState({
        buyer: "",
        line: "",
        style: ""
    })

    // Add Production state
    const [allAssignments, setAllAssignments] = React.useState<ProductionAssignment[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
    const [searchAssignment, setSearchAssignment] = React.useState("")
    const [isExporting, setIsExporting] = React.useState(false)

    // Form state
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [selectedItem, setSelectedItem] = React.useState<DailyReportItem | null>(null)
    const [dailyRecord, setDailyRecord] = React.useState<DailyProductionRecord | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    // Dynamic Hours state
    const [visibleHours, setVisibleHours] = React.useState<number[]>([])

    // Delete state
    const [itemToDelete, setItemToDelete] = React.useState<DailyReportItem | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const formattedDate = React.useMemo(() => {
        return selectedDate.toISOString().split('T')[0]
    }, [selectedDate])

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await productionAssignmentService.getDailyReport({ 
                date: formattedDate,
                buyer: filters.buyer || undefined,
                lineName: filters.line || undefined,
                styleNo: filters.style || undefined
            })
            setReportItems(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load production data")
        } finally {
            setIsLoading(false)
        }
    }, [formattedDate, filters])

    const fetchAssignments = async () => {
        try {
            const data = await productionAssignmentService.getAll()
            setAllAssignments(data)
        } catch (error) {
            toast.error("Failed to load assignments")
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleOpenEntry = async (item: DailyReportItem) => {
        setSelectedItem(item)
        try {
            const record = await productionAssignmentService.getDailyRecord(item.assignmentId, formattedDate)
            setDailyRecord(record)
            
            // Initialize visible hours with those that have values
            const hoursWithData = Array.from({ length: 19 }, (_, i) => i + 1).filter(h => (record as any)?.[`h${h}`] > 0)
            setVisibleHours(hoursWithData.length > 0 ? hoursWithData : [])
            
            setIsSheetOpen(true)
        } catch (error) {
            toast.error("Failed to load daily record")
        }
    }

    const handleAddHour = () => {
        setVisibleHours(prev => {
            if (prev.length >= 18) return prev
            
            let nextHour = prev.length === 0 ? 1 : Math.max(...prev) + 1
            if (nextHour === 6) nextHour = 7 // Skip break time (1 PM - 2 PM)
            if (nextHour > 19) return prev

            return [...prev, nextHour].sort((a, b) => a - b)
        })
    }

    const handleQuickAdd = async (assignment: ProductionAssignment) => {
        const item: DailyReportItem = {
            id: `${assignment.lineName}-${assignment.styleNo}`,
            assignmentId: assignment.id,
            lineName: assignment.lineName,
            styleNo: assignment.styleNo,
            buyer: assignment.buyer,
            dailyTarget: 0,
            hourlyTarget: 0,
            completed: 0,
            achievement: 0
        }
        setIsAddDialogOpen(false)
        handleOpenEntry(item)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedItem || !dailyRecord) return

        setIsSaving(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            assignmentId: selectedItem.assignmentId,
            date: formattedDate,
            dailyTarget: parseInt(formData.get("dailyTarget") as string) || 0,
            hourlyTarget: parseInt(formData.get("hourlyTarget") as string) || 0,
            h1: parseInt(formData.get("h1") as string) || 0,
            h2: parseInt(formData.get("h2") as string) || 0,
            h3: parseInt(formData.get("h3") as string) || 0,
            h4: parseInt(formData.get("h4") as string) || 0,
            h5: parseInt(formData.get("h5") as string) || 0,
            h6: parseInt(formData.get("h6") as string) || 0,
            h7: parseInt(formData.get("h7") as string) || 0,
            h8: parseInt(formData.get("h8") as string) || 0,
            h9: parseInt(formData.get("h9") as string) || 0,
            h10: parseInt(formData.get("h10") as string) || 0,
            h11: parseInt(formData.get("h11") as string) || 0,
            h12: parseInt(formData.get("h12") as string) || 0,
            h13: parseInt(formData.get("h13") as string) || 0,
            h14: parseInt(formData.get("h14") as string) || 0,
            h15: parseInt(formData.get("h15") as string) || 0,
            h16: parseInt(formData.get("h16") as string) || 0,
            h17: parseInt(formData.get("h17") as string) || 0,
            h18: parseInt(formData.get("h18") as string) || 0,
            h19: parseInt(formData.get("h19") as string) || 0,
        }

        try {
            await productionAssignmentService.saveDailyRecord(data)
            toast.success("Production record saved")
            setIsSheetOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to save production record")
        } finally {
            setIsSaving(false)
        }
    }

    const handleExportExcel = async () => {
        setIsExporting(true)
        try {
            await productionAssignmentService.exportHourlyExcel({
                date: formattedDate,
                buyer: filters.buyer || undefined,
                lineName: filters.line || undefined,
                styleNo: filters.style || undefined
            })
            toast.success("Hourly breakdown report exported successfully")
        } catch (error) {
            toast.error("Failed to export Excel report")
        } finally {
            setIsExporting(false)
        }
    }

    const handleDelete = async () => {
        if (!itemToDelete) return

        setIsDeleting(true)
        try {
            await productionAssignmentService.deleteDailyRecord(itemToDelete.assignmentId, formattedDate)
            toast.success("Production record deleted")
            fetchData()
            setItemToDelete(null)
        } catch (error) {
            toast.error("Failed to delete production record")
        } finally {
            setIsDeleting(false)
        }
    }

    const columns: ColumnDef<DailyReportItem>[] = [
        {
            accessorKey: "lineName",
            header: "Line / Buyer",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground leading-none mb-1">{row.getValue("lineName")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">{row.original.buyer}</span>
                </div>
            ),
        },
        {
            accessorKey: "styleNo",
            header: "Style No",
            cell: ({ row }) => <Badge variant="outline" className="font-mono font-bold bg-muted/30">{row.getValue("styleNo")}</Badge>,
        },
        {
            accessorKey: "dailyTarget",
            header: "Targets (D/H)",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1 rounded dark:bg-orange-900/20">D</span>
                        <span className="font-bold text-sm">{row.original.dailyTarget}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded dark:bg-blue-900/20">H</span>
                        <span className="font-medium text-xs text-muted-foreground">{row.original.hourlyTarget}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "completed",
            header: "Total Output",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xl font-black text-primary">{row.original.completed}</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">UNITS TODAY</span>
                </div>
            )
        },
        {
            accessorKey: "achievement",
            header: "Achievement",
            cell: ({ row }) => {
                const value = row.original.achievement
                const colorClass = value >= 100 ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20" : value >= 80 ? "text-blue-700 bg-blue-50 dark:bg-blue-950/20" : "text-amber-700 bg-amber-50 dark:bg-amber-950/20"
                return (
                    <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                        <div className="flex items-center justify-between">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", colorClass)}>
                                {value.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenEntry(row.original)} 
                        className="gap-2 h-8 font-bold border-primary/20 hover:bg-primary/5 text-primary"
                    >
                        <IconClock size={14} /> Entry Data
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setItemToDelete(row.original)} 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <IconTrash size={16} />
                    </Button>
                </div>
            )
        }
    ]

    const getHourLabel = (h: number) => {
        const startHour = (h + 7) % 24;
        const endHour = (h + 8) % 24;

        const format = (hour: number) => {
            const h12 = hour % 12 === 0 ? 12 : hour % 12;
            const ampm = hour >= 12 ? "PM" : "AM";
            return `${h12}:00 ${ampm}`;
        };

        return `${format(startHour)} - ${format(endHour)}`;
    };

    const filteredAssignments = allAssignments.filter(a => 
        a.styleNo.toLowerCase().includes(searchAssignment.toLowerCase()) ||
        a.buyer.toLowerCase().includes(searchAssignment.toLowerCase()) ||
        a.lineName.toLowerCase().includes(searchAssignment.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 min-h-screen bg-muted/30">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 lg:px-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <IconTarget className="size-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">Daily Input</h1>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                            Real-time Hourly Production Tracking
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <DatePicker 
                        date={selectedDate} 
                        setDate={(d) => d && setSelectedDate(d)} 
                        className="h-9 w-[180px] font-bold"
                    />
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2 h-9 font-bold"
                    >
                        <IconFilter size={16} /> Filters
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExportExcel} 
                        disabled={isLoading || isExporting}
                        className="gap-2 h-9 font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:hover:bg-emerald-950/20"
                    >
                        {isExporting ? <IconReload size={16} className="animate-spin" /> : <IconFileSpreadsheet size={16} />} 
                        Export Excel
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => fetchData()} className="rounded-full h-9 w-9">
                        <IconReload size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                        setIsAddDialogOpen(open)
                        if (open) fetchAssignments()
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="gap-2 h-9 font-bold shadow-md">
                                <IconPlus size={16} /> Add Production
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl dark:bg-card">
                            <DialogHeader>
                                <DialogTitle>Start Production Activity</DialogTitle>
                                <DialogDescription>Select an assignment to begin data entry for today.</DialogDescription>
                            </DialogHeader>
                            <div className="relative my-4">
                                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-9" 
                                    placeholder="Find by Style, Line or Buyer..." 
                                    value={searchAssignment}
                                    onChange={e => setSearchAssignment(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="h-72">
                                <div className="space-y-2">
                                    {filteredAssignments.map((a) => (
                                        <button
                                            key={a.id}
                                            onClick={() => handleQuickAdd(a)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold text-sm">{a.styleNo}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase">{a.lineName} • {a.buyer}</span>
                                            </div>
                                            <IconArrowRight size={16} className="text-muted-foreground opacity-30" />
                                        </button>
                                    ))}
                                    {filteredAssignments.length === 0 && (
                                        <div className="text-center py-10 text-muted-foreground text-sm">No assignments found</div>
                                    )}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <div className="mx-4 lg:mx-6 p-4 rounded-xl border bg-card shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h2 className="text-sm font-black uppercase text-foreground">Filter Controls</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Buyer Search</Label>
                            <Input 
                                placeholder="H&M, Zara..." 
                                value={filters.buyer}
                                onChange={e => setFilters(f => ({ ...f, buyer: e.target.value }))}
                                className="h-9 text-xs" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Production Line</Label>
                            <Input 
                                placeholder="Line Name..." 
                                value={filters.line}
                                onChange={e => setFilters(f => ({ ...f, line: e.target.value }))}
                                className="h-9 text-xs" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Style Reference</Label>
                            <Input 
                                placeholder="Style No..." 
                                value={filters.style}
                                onChange={e => setFilters(f => ({ ...f, style: e.target.value }))}
                                className="h-9 text-xs" 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="px-4 lg:px-6">
                <DataTable
                    data={reportItems}
                    columns={columns}
                    isLoading={isLoading}
                    showTabs={false}
                    searchKey="styleNo"
                />
            </div>

            {/* Hourly Entry Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-xl flex flex-col h-full bg-background dark:bg-card">
                    <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                        <SheetHeader className="border-b pb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <IconClock className="size-4 text-primary" />
                                <Badge variant="outline" className="text-[10px] font-bold uppercase py-0">{formattedDate}</Badge>
                            </div>
                            <SheetTitle className="text-2xl font-black">{selectedItem?.styleNo}</SheetTitle>
                            <SheetDescription className="font-medium text-xs">
                                Line: {selectedItem?.lineName} • Buyer: {selectedItem?.buyer}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto py-6 space-y-6">
                            {/* Target Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 shadow-sm transition-all hover:shadow-md">
                                    <p className="text-[10px] font-bold uppercase text-orange-600 mb-2">Daily Target</p>
                                    <div className="text-2xl font-black text-orange-700 dark:text-orange-500">
                                        {dailyRecord?.dailyTarget || 0}
                                    </div>
                                    <input type="hidden" name="dailyTarget" value={dailyRecord?.dailyTarget || 0} />
                                </div>
                                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 shadow-sm transition-all hover:shadow-md">
                                    <p className="text-[10px] font-bold uppercase text-blue-600 mb-2">Hourly Target</p>
                                    <div className="text-2xl font-black text-blue-700 dark:text-blue-500">
                                        {dailyRecord?.hourlyTarget || 0}
                                    </div>
                                    <input type="hidden" name="hourlyTarget" value={dailyRecord?.hourlyTarget || 0} />
                                </div>
                            </div>

                            {/* Hourly Breakdown */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <IconHistory size={16} className="text-muted-foreground" />
                                        <h3 className="text-sm font-bold">Hourly Production Breakdown</h3>
                                    </div>
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleAddHour}
                                        className="h-7 gap-1 text-[10px] font-bold uppercase border-primary/20 hover:bg-primary/5 text-primary"
                                        disabled={visibleHours.length >= 18}
                                    >
                                        <IconPlus size={12} /> Add Hour
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {visibleHours.map((hour) => (
                                        <div key={hour} className="flex items-center gap-4 p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground truncate leading-none mb-1">
                                                    Time Slot
                                                </p>
                                                <p className="text-sm font-black text-foreground">{getHourLabel(hour)}</p>
                                            </div>
                                            <div className="w-32">
                                                <Input
                                                    name={`h${hour}`}
                                                    type="number"
                                                    defaultValue={(dailyRecord as any)?.[`h${hour}`] || ""}
                                                    className="h-10 text-lg font-black text-right bg-background border-primary/20 focus-visible:ring-primary"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {visibleHours.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-xl bg-muted/5">
                                            <IconClock size={40} className="text-muted-foreground/20 mb-3" />
                                            <p className="text-sm font-medium text-muted-foreground">No hourly slots added yet</p>
                                            <Button 
                                                type="button"
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={handleAddHour}
                                                className="mt-2 text-xs text-primary font-bold"
                                            >
                                                Click to add your first hour
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 min-w-[120px]" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Production"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the production data for <span className="font-bold text-foreground">{itemToDelete?.styleNo}</span> on line <span className="font-bold text-foreground">{itemToDelete?.lineName}</span> for <span className="font-bold text-foreground">{formattedDate}</span>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Record"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

