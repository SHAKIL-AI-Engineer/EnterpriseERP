"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  IconCalculator,
  IconDeviceFloppy,
  IconRefresh,
  IconSend,
  IconCurrencyDollar,
  IconCoins,
  IconInfoCircle,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { CreateOrderCostingRequest, Order, OrderCosting } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

type CostingForm = {
  fabricCost: string
  accessoriesCost: string
  cm: string
  washingCost: string
  embroideryCost: string
  printingCost: string
  otherCost: string
  sellingPrice: string
  freightCost: string
  commercialCost: string
  bankCharges: string
  commission: string
}

const emptyForm: CostingForm = {
  fabricCost: "",
  accessoriesCost: "",
  cm: "",
  washingCost: "",
  embroideryCost: "",
  printingCost: "",
  otherCost: "",
  sellingPrice: "",
  freightCost: "",
  commercialCost: "",
  bankCharges: "",
  commission: "",
}

function fromApi(costing: OrderCosting): CostingForm {
  return {
    fabricCost: String(costing.fabricCost || ""),
    accessoriesCost: String(costing.accessoriesCost || ""),
    cm: String(costing.cm || ""),
    washingCost: String(costing.washingCost || ""),
    embroideryCost: String(costing.embroideryCost || ""),
    printingCost: String(costing.printingCost || ""),
    otherCost: String(costing.otherCost || ""),
    sellingPrice: String(costing.sellingPrice || ""),
    freightCost: String(costing.freightCost || ""),
    commercialCost: String(costing.commercialCost || ""),
    bankCharges: String(costing.bankCharges || ""),
    commission: String(costing.commission || ""),
  }
}

export default function CostingPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <CostingPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function CostingPageContent({ companyId }: { companyId: string }) {
  const searchParams = useSearchParams()
  const initialOrderId = searchParams.get("orderId") ?? ""

  const [orders, setOrders] = React.useState<Order[]>([])
  const [draftOrderId, setDraftOrderId] = React.useState(initialOrderId)
  const [selectedOrderId, setSelectedOrderId] = React.useState(initialOrderId)
  const [costing, setCosting] = React.useState<CostingForm>(emptyForm)
  const [existingId, setExistingId] = React.useState<string | null>(null)
  const [approvalStatus, setApprovalStatus] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    merchandisingService.getOrders(companyId).then((rows) => {
      setOrders(rows)
      if (!selectedOrderId && rows.length > 0) {
        const first = initialOrderId || rows[0].id
        setDraftOrderId(first)
        setSelectedOrderId(first)
      }
    }).catch(console.error)
  }, [companyId, initialOrderId, selectedOrderId])

  const loadCosting = React.useCallback(async (orderId: string) => {
    if (!orderId) {
      setCosting(emptyForm)
      setExistingId(null)
      setApprovalStatus("")
      return
    }
    try {
      setLoading(true)
      const data = await merchandisingService.getOrderCosting(orderId)
      if (data) {
        setCosting(fromApi(data))
        setExistingId(data.id)
        setApprovalStatus(data.approvalStatus)
      } else {
        setCosting(emptyForm)
        setExistingId(null)
        setApprovalStatus("Draft")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load costing")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (selectedOrderId) loadCosting(selectedOrderId)
  }, [selectedOrderId, loadCosting])

  const applyOrder = () => setSelectedOrderId(draftOrderId)

  const buildPayload = (): CreateOrderCostingRequest => ({
    companyId,
    fabricCost: Number(costing.fabricCost || 0),
    accessoriesCost: Number(costing.accessoriesCost || 0),
    cm: Number(costing.cm || 0),
    washingCost: Number(costing.washingCost || 0),
    embroideryCost: Number(costing.embroideryCost || 0),
    printingCost: Number(costing.printingCost || 0),
    otherCost: Number(costing.otherCost || 0),
    sellingPrice: Number(costing.sellingPrice || 0),
    freightCost: Number(costing.freightCost || 0),
    commercialCost: Number(costing.commercialCost || 0),
    bankCharges: Number(costing.bankCharges || 0),
    commission: Number(costing.commission || 0),
  })

  const computedTotal = React.useMemo(() => {
    const keys = [
      "fabricCost",
      "accessoriesCost",
      "cm",
      "washingCost",
      "embroideryCost",
      "printingCost",
      "otherCost",
      "freightCost",
      "commercialCost",
      "bankCharges",
      "commission",
    ] as const
    return keys.reduce((sum, key) => sum + Number(costing[key] || 0), 0)
  }, [costing])

  const handleSave = async () => {
    if (!selectedOrderId) {
      toast.error("Select an order first")
      return
    }
    try {
      setSaving(true)
      const payload = buildPayload()
      if (existingId) {
        await merchandisingService.updateOrderCosting(selectedOrderId, payload)
        toast.success("Costing updated")
      } else {
        await merchandisingService.createOrderCosting(selectedOrderId, payload)
        toast.success("Costing created")
      }
      loadCosting(selectedOrderId)
    } catch (error) {
      console.error(error)
      toast.error("Failed to save costing")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitApproval = async () => {
    if (!selectedOrderId) return
    try {
      setSaving(true)
      await merchandisingService.submitCostingApproval(selectedOrderId)
      toast.success("Costing submitted for approval")
      loadCosting(selectedOrderId)
    } catch (error) {
      console.error(error)
      toast.error("Failed to submit costing")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CostingForm, value: string) => {
    setCosting((prev) => ({ ...prev, [field]: value }))
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconCalculator className="size-6" />}
        title="Costing Sheet"
        description="Order-level price analysis and margin optimization"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setDraftOrderId("")
                setSelectedOrderId("")
                setCosting(emptyForm)
                setExistingId(null)
                setApprovalStatus("")
              }}
            >
              <IconRefresh className="size-4" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleSubmitApproval}
              disabled={saving || !selectedOrderId || !existingId}
            >
              <IconSend className="size-4" />
              Submit Approval
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving || !selectedOrderId}>
              <IconDeviceFloppy className="size-4" />
              {saving ? "Saving..." : existingId ? "Update" : "Save"}
            </Button>
          </>
        }
      />

      <MerchFilterCard isLoading={loading} onApply={applyOrder}>
        <MerchFilterField label="Order">
          <NativeSelect
            value={draftOrderId}
            onChange={(e) => setDraftOrderId(e.target.value)}
          >
            <option value="">Select order</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo}
              </option>
            ))}
          </NativeSelect>
        </MerchFilterField>
      </MerchFilterCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Cost" value={`$${computedTotal.toFixed(2)}`} icon={IconCurrencyDollar} color="text-primary" bgColor="bg-primary/10" />
        <KPICard title="Selling Price" value={`$${Number(costing.sellingPrice || 0).toFixed(2)}`} icon={IconCoins} color="text-emerald-600" bgColor="bg-emerald-100" />
        <KPICard title="Status" value={approvalStatus || "—"} icon={IconInfoCircle} color="text-indigo-600" bgColor="bg-indigo-100" />
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Cost Breakdown — {selectedOrder?.orderNo ?? "No order"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CostInput label="Fabric Cost" value={costing.fabricCost} onChange={(v) => handleInputChange("fabricCost", v)} />
            <CostInput label="Trims & Accessories" value={costing.accessoriesCost} onChange={(v) => handleInputChange("accessoriesCost", v)} />
            <CostInput label="CM (Cut & Make)" value={costing.cm} onChange={(v) => handleInputChange("cm", v)} />
            <CostInput label="Washing" value={costing.washingCost} onChange={(v) => handleInputChange("washingCost", v)} />
            <CostInput label="Embroidery" value={costing.embroideryCost} onChange={(v) => handleInputChange("embroideryCost", v)} />
            <CostInput label="Printing" value={costing.printingCost} onChange={(v) => handleInputChange("printingCost", v)} />
            <CostInput label="Other Cost" value={costing.otherCost} onChange={(v) => handleInputChange("otherCost", v)} />
            <CostInput label="Freight" value={costing.freightCost} onChange={(v) => handleInputChange("freightCost", v)} />
            <CostInput label="Commercial" value={costing.commercialCost} onChange={(v) => handleInputChange("commercialCost", v)} />
            <CostInput label="Bank Charges" value={costing.bankCharges} onChange={(v) => handleInputChange("bankCharges", v)} />
            <CostInput label="Commission" value={costing.commission} onChange={(v) => handleInputChange("commission", v)} />
            <CostInput label="Selling Price" value={costing.sellingPrice} onChange={(v) => handleInputChange("sellingPrice", v)} />
          </div>
          <div className="mt-8 p-6 bg-muted/40 rounded-xl flex items-center justify-between border">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Computed Total</p>
              <span className="text-3xl font-bold tabular-nums">${computedTotal.toFixed(2)}</span>
            </div>
            {approvalStatus ? (
              <Badge className="py-1.5 px-4 font-bold text-xs">{approvalStatus}</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </MerchPageShell>
  )
}

function CostInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
        <Input
          type="number"
          className="pl-7 h-10 border-muted-foreground/10 bg-muted/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-xl font-bold">{value}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
