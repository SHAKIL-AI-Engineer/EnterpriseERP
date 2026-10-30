"use client"

import * as React from "react"
import {
  IconTestPipe,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconX,
  IconSend,
  IconRotate,
  IconCurrencyDollar,
  IconDotsVertical,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Buyer, Sample, Style } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

export default function SamplesPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <SamplesPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function SamplesPageContent({ companyId }: { companyId: string }) {
  const [samples, setSamples] = React.useState<Sample[]>([])
  const [buyers, setBuyers] = React.useState<Buyer[]>([])
  const [styles, setStyles] = React.useState<Style[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [workflowOpen, setWorkflowOpen] = React.useState(false)
  const [workflowSample, setWorkflowSample] = React.useState<Sample | null>(null)
  const [workflowMode, setWorkflowMode] = React.useState<"submit" | "revise" | "costing">("submit")
  const [workflowForm, setWorkflowForm] = React.useState({
    submitDate: new Date().toISOString().slice(0, 10),
    remarks: "",
    fabricCost: 0,
    trimsCost: 0,
    cmCost: 0,
  })
  const [form, setForm] = React.useState({
    buyerId: "",
    styleId: "",
    sampleType: "Proto",
    requestDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  })

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [sampleRows, buyerRows] = await Promise.all([
        merchandisingService.getSamples(companyId),
        merchandisingService.getBuyers(companyId),
      ])
      setSamples(sampleRows)
      setBuyers(buyerRows)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load samples")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleBuyerChange = async (buyerId: string) => {
    setForm((p) => ({ ...p, buyerId, styleId: "" }))
    if (!buyerId) {
      setStyles([])
      return
    }
    try {
      const styleRows = await merchandisingService.getStyles(companyId, buyerId)
      setStyles(styleRows)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreate = async () => {
    if (!form.buyerId || !form.styleId) {
      toast.error("Buyer and style are required")
      return
    }
    try {
      await merchandisingService.createSample({
        companyId,
        buyerId: form.buyerId,
        styleId: form.styleId,
        sampleType: form.sampleType,
        requestDate: form.requestDate,
        remarks: form.remarks || undefined,
      })
      toast.success("Sample created")
      setIsCreateOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create sample")
    }
  }

  const runWorkflow = async (sample: Sample, action: "approve" | "reject") => {
    try {
      if (action === "approve") await merchandisingService.approveSample(sample.id)
      else await merchandisingService.rejectSample(sample.id)
      toast.success(`Sample ${action === "approve" ? "approved" : "rejected"}`)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error(`Failed to ${action} sample`)
    }
  }

  const openWorkflow = (sample: Sample, mode: typeof workflowMode) => {
    setWorkflowSample(sample)
    setWorkflowMode(mode)
    setWorkflowForm({
      submitDate: new Date().toISOString().slice(0, 10),
      remarks: sample.remarks ?? "",
      fabricCost: 0,
      trimsCost: 0,
      cmCost: 0,
    })
    setWorkflowOpen(true)
  }

  const handleWorkflowSubmit = async () => {
    if (!workflowSample) return
    try {
      if (workflowMode === "submit") {
        await merchandisingService.submitSample(workflowSample.id, {
          submitDate: workflowForm.submitDate,
          remarks: workflowForm.remarks || undefined,
        })
        toast.success("Sample submitted")
      } else if (workflowMode === "revise") {
        await merchandisingService.reviseSample(workflowSample.id, {
          remarks: workflowForm.remarks || undefined,
        })
        toast.success("Revision requested")
      } else {
        await merchandisingService.createSampleCosting(workflowSample.id, {
          companyId,
          fabricCost: workflowForm.fabricCost,
          trimsCost: workflowForm.trimsCost,
          cmCost: workflowForm.cmCost,
        })
        toast.success("Sample costing saved")
      }
      setWorkflowOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Workflow action failed")
    }
  }

  const columns = React.useMemo<ColumnDef<Sample>[]>(
    () => [
      {
        accessorKey: "sampleType",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold uppercase">
            {row.original.sampleType}
          </Badge>
        ),
      },
      {
        accessorKey: "requestDate",
        header: "Requested",
        cell: ({ row }) => format(new Date(row.original.requestDate), "MMM dd, yyyy"),
      },
      {
        accessorKey: "submitDate",
        header: "Submitted",
        cell: ({ row }) =>
          row.original.submitDate ? format(new Date(row.original.submitDate), "MMM dd, yyyy") : "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "text-[10px] font-bold uppercase border-none",
              row.original.status === "Approved"
                ? "bg-emerald-100 text-emerald-700"
                : row.original.status === "Rejected"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700",
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
            {row.original.remarks ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openWorkflow(row.original, "submit")}>
                <IconSend className="size-4 mr-2" /> Submit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openWorkflow(row.original, "revise")}>
                <IconRotate className="size-4 mr-2" /> Revise
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openWorkflow(row.original, "costing")}>
                <IconCurrencyDollar className="size-4 mr-2" /> Costing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => runWorkflow(row.original, "approve")}>
                <IconCheck className="size-4 mr-2 text-emerald-600" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => runWorkflow(row.original, "reject")}>
                <IconX className="size-4 mr-2 text-destructive" /> Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  )

  const activeCount = samples.filter((s) => s.status !== "Approved" && s.status !== "Rejected").length

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconTestPipe className="size-6" />}
        title="Sample Tracking"
        description={`${samples.length} samples · ${activeCount} in progress`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              New Sample
            </Button>
          </>
        }
      />

      <MerchTableCard isLoading={loading}>
        <DataTable columns={columns} data={samples} searchKey="sampleType" showTabs={false} showActions={false} />
      </MerchTableCard>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sample</DialogTitle>
            <DialogDescription>Register a development sample request</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Buyer</Label>
              <NativeSelect value={form.buyerId} onChange={(e) => handleBuyerChange(e.target.value)}>
                <option value="">Select buyer</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>{b.buyerName}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Style</Label>
              <NativeSelect
                value={form.styleId}
                disabled={!form.buyerId}
                onChange={(e) => setForm((p) => ({ ...p, styleId: e.target.value }))}
              >
                <option value="">Select style</option>
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>{s.styleNo}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <NativeSelect value={form.sampleType} onChange={(e) => setForm((p) => ({ ...p, sampleType: e.target.value }))}>
                  <option value="Proto">Proto</option>
                  <option value="Fit">Fit</option>
                  <option value="Salesman">Salesman</option>
                  <option value="PP">PP</option>
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Request Date</Label>
                <Input type="date" value={form.requestDate} onChange={(e) => setForm((p) => ({ ...p, requestDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Remarks</Label>
              <Input value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={workflowOpen} onOpenChange={setWorkflowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {workflowMode === "submit" ? "Submit Sample" : workflowMode === "revise" ? "Request Revision" : "Sample Costing"}
            </DialogTitle>
            <DialogDescription>
              {workflowSample?.sampleType} · {workflowSample?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {workflowMode === "submit" ? (
              <div className="space-y-2">
                <Label className="text-xs">Submit Date</Label>
                <Input
                  type="date"
                  value={workflowForm.submitDate}
                  onChange={(e) => setWorkflowForm((p) => ({ ...p, submitDate: e.target.value }))}
                />
              </div>
            ) : null}
            {workflowMode === "costing" ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Fabric</Label>
                  <Input
                    type="number"
                    value={workflowForm.fabricCost}
                    onChange={(e) => setWorkflowForm((p) => ({ ...p, fabricCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Trims</Label>
                  <Input
                    type="number"
                    value={workflowForm.trimsCost}
                    onChange={(e) => setWorkflowForm((p) => ({ ...p, trimsCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">CM</Label>
                  <Input
                    type="number"
                    value={workflowForm.cmCost}
                    onChange={(e) => setWorkflowForm((p) => ({ ...p, cmCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            ) : null}
            {workflowMode !== "costing" ? (
              <div className="space-y-2">
                <Label className="text-xs">Remarks</Label>
                <Input value={workflowForm.remarks} onChange={(e) => setWorkflowForm((p) => ({ ...p, remarks: e.target.value }))} />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkflowOpen(false)}>Cancel</Button>
            <Button onClick={handleWorkflowSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
