"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { IconScale, IconCalculator, IconRefresh } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { BomCalculationResult, BomItem, Order } from "@/lib/types/merchandising"

export default function ConsumptionPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <ConsumptionPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function ConsumptionPageContent({ companyId }: { companyId: string }) {
  const searchParams = useSearchParams()
  const initialOrderId = searchParams.get("orderId") ?? ""

  const [orders, setOrders] = React.useState<Order[]>([])
  const [draftOrderId, setDraftOrderId] = React.useState(initialOrderId)
  const [selectedOrderId, setSelectedOrderId] = React.useState(initialOrderId)
  const [bomItems, setBomItems] = React.useState<BomItem[]>([])
  const [calcResult, setCalcResult] = React.useState<BomCalculationResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await merchandisingService.getOrders(companyId)
      setOrders(data)
      if (!selectedOrderId && data.length > 0) {
        const first = initialOrderId || data[0].id
        setDraftOrderId(first)
        setSelectedOrderId(first)
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [companyId, initialOrderId, selectedOrderId])

  const loadBom = React.useCallback(async (orderId: string) => {
    if (!orderId) {
      setBomItems([])
      setCalcResult(null)
      return
    }
    try {
      setBusy(true)
      const data = await merchandisingService.getBomItems(orderId)
      setBomItems(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load consumption data")
    } finally {
      setBusy(false)
    }
  }, [])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  React.useEffect(() => {
    if (selectedOrderId) loadBom(selectedOrderId)
  }, [selectedOrderId, loadBom])

  const applyOrder = () => setSelectedOrderId(draftOrderId)

  const handleRecalculate = async () => {
    if (!selectedOrderId) return
    try {
      setBusy(true)
      const result = await merchandisingService.calculateBom(selectedOrderId)
      setCalcResult(result)
      await loadBom(selectedOrderId)
      toast.success("Consumption recalculated from BOM")
    } catch (error) {
      console.error(error)
      toast.error("Recalculation failed")
    } finally {
      setBusy(false)
    }
  }

  const filtered = bomItems.filter(
    (item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemType.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const fabricItems = filtered.filter((i) => i.itemType === "Fabric")
  const trimItems = filtered.filter((i) => i.itemType !== "Fabric")
  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconScale className="size-6" />}
        title="Consumption Logic"
        description="BOM-based fabric and trim requirements with live calculation"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => selectedOrderId && loadBom(selectedOrderId)}
              disabled={busy || !selectedOrderId}
            >
              <IconRefresh className="size-4" />
              Reload
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleRecalculate}
              disabled={busy || !selectedOrderId}
            >
              <IconCalculator className="size-4" />
              Recalculate BOM
            </Button>
          </>
        }
      />

      <MerchFilterCard
        recordCount={filtered.length}
        isLoading={loading || busy}
        onApply={applyOrder}
        onReset={() => {
          setDraftOrderId("")
          setSelectedOrderId("")
          setBomItems([])
          setCalcResult(null)
          setSearchQuery("")
        }}
      >
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
        <MerchFilterField label="Filter items">
          <Input
            placeholder="Search consumption lines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </MerchFilterField>
      </MerchFilterCard>

      {calcResult ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <SummaryChip label="Items" value={String(calcResult.totalRequiredItems)} />
          <SummaryChip label="Total required qty" value={calcResult.totalRequiredQuantity.toLocaleString()} />
          <SummaryChip label="Material cost" value={`$${calcResult.totalCost.toFixed(2)}`} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsumptionPanel
          title="Fabric Consumption"
          subtitle={selectedOrder?.orderNo ?? ""}
          items={fabricItems}
          loading={busy && bomItems.length === 0}
        />
        <ConsumptionPanel
          title="Trims & Accessories"
          subtitle={`${trimItems.length} items`}
          items={trimItems}
          loading={busy && bomItems.length === 0}
        />
      </div>
    </MerchPageShell>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className="font-bold tabular-nums">{value}</p>
    </div>
  )
}

function ConsumptionPanel({
  title,
  subtitle,
  items,
  loading,
}: {
  title: string
  subtitle: string
  items: BomItem[]
  loading: boolean
}) {
  return (
    <MerchTableCard isLoading={loading} loadingMessage={`Loading ${title}...`}>
      <div className="px-4 py-3 border-b">
        <p className="text-sm font-bold uppercase tracking-wider">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-xs font-bold">Item</TableHead>
            <TableHead className="text-xs font-bold text-center">Consumption</TableHead>
            <TableHead className="text-xs font-bold text-center">Wastage</TableHead>
            <TableHead className="text-xs font-bold text-right">Required</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                No items
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-semibold text-sm">{item.itemName}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {item.itemType}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm font-medium">
                  {item.consumption} {item.unitName}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px]">
                    {item.wastagePercent}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums">
                  {item.requiredQty.toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </MerchTableCard>
  )
}
