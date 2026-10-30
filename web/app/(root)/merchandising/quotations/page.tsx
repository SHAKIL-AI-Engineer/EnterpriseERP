"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconFileInvoice,
  IconPlus,
  IconRefresh,
  IconExternalLink,
  IconShoppingCart,
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
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type {
  Buyer,
  ConvertQuotationToOrderRequest,
  CreateQuotationLineRequest,
  CreateQuotationRequest,
  Quotation,
  Style,
} from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

export default function QuotationsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <QuotationsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function QuotationsPageContent({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [quotations, setQuotations] = React.useState<Quotation[]>([])
  const [buyers, setBuyers] = React.useState<Buyer[]>([])
  const [styles, setStyles] = React.useState<Style[]>([])
  const [loading, setLoading] = React.useState(true)
  const [buyerFilter, setBuyerFilter] = React.useState("all")
  const [appliedBuyerFilter, setAppliedBuyerFilter] = React.useState("all")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [convertOpen, setConvertOpen] = React.useState(false)
  const [converting, setConverting] = React.useState<Quotation | null>(null)
  const [convertForm, setConvertForm] = React.useState({
    orderNo: "",
    orderDate: new Date().toISOString().slice(0, 10),
    totalOrderQty: 0,
    unitPrice: 0,
    currencyCode: "USD",
  })
  const [form, setForm] = React.useState({
    buyerId: "",
    styleId: "",
    quotationNo: "",
    quotationDate: new Date().toISOString().slice(0, 10),
    validUntil: "",
    lineDescription: "",
    lineQty: 0,
    linePrice: 0,
  })

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const buyerId = appliedBuyerFilter === "all" ? undefined : appliedBuyerFilter
      const [quotationRows, buyerRows] = await Promise.all([
        merchandisingService.getQuotations(companyId, buyerId),
        merchandisingService.getBuyers(companyId),
      ])
      setQuotations(quotationRows)
      setBuyers(buyerRows)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load quotations")
    } finally {
      setLoading(false)
    }
  }, [companyId, appliedBuyerFilter])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleBuyerChange = async (buyerId: string) => {
    setForm((p) => ({ ...p, buyerId, styleId: "" }))
    if (!buyerId) {
      setStyles([])
      return
    }
    const styleRows = await merchandisingService.getStyles(companyId, buyerId)
    setStyles(styleRows)
  }

  const buyerName = (buyerId: string) => buyers.find((b) => b.id === buyerId)?.buyerName ?? "—"

  const handleCreate = async () => {
    if (!form.buyerId || !form.styleId || !form.quotationNo.trim()) {
      toast.error("Buyer, style, and quotation number are required")
      return
    }
    const lines: CreateQuotationLineRequest[] = form.lineDescription.trim()
      ? [
          {
            itemDescription: form.lineDescription.trim(),
            quantity: form.lineQty || 1,
            unitPrice: form.linePrice || 0,
          },
        ]
      : [{ itemDescription: "Line 1", quantity: 1, unitPrice: 0 }]
    try {
      const payload: CreateQuotationRequest = {
        companyId,
        buyerId: form.buyerId,
        styleId: form.styleId,
        quotationNo: form.quotationNo.trim(),
        quotationDate: form.quotationDate,
        validUntil: form.validUntil || undefined,
        lines,
      }
      const created = await merchandisingService.createQuotation(payload)
      toast.success("Quotation created")
      setIsCreateOpen(false)
      fetchData()
      router.push(`/merchandising/quotations/${created.id}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to create quotation")
    }
  }

  const handleConvert = async () => {
    if (!converting || !convertForm.orderNo.trim()) {
      toast.error("Order number is required")
      return
    }
    try {
      const payload: ConvertQuotationToOrderRequest = {
        orderNo: convertForm.orderNo.trim(),
        orderDate: convertForm.orderDate,
        totalOrderQty: convertForm.totalOrderQty,
        unitPrice: convertForm.unitPrice,
        currencyCode: convertForm.currencyCode,
      }
      const order = await merchandisingService.convertQuotationToOrder(converting.id, payload)
      toast.success("Converted to order")
      setConvertOpen(false)
      router.push(`/merchandising/orders/details/${order.id}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to convert quotation")
    }
  }

  const columns = React.useMemo<ColumnDef<Quotation>[]>(
    () => [
      {
        accessorKey: "quotationNo",
        header: "Quotation",
        cell: ({ row }) => (
          <Link href={`/merchandising/quotations/${row.original.id}`} className="font-bold text-erp-accent hover:underline">
            {row.original.quotationNo}
          </Link>
        ),
      },
      {
        id: "buyer",
        header: "Buyer",
        cell: ({ row }) => <span className="text-xs">{buyerName(row.original.buyerId)}</span>,
      },
      {
        accessorKey: "quotationDate",
        header: "Date",
        cell: ({ row }) => format(new Date(row.original.quotationDate), "MMM dd, yyyy"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant="outline" className="text-[10px] uppercase">{row.original.status}</Badge>,
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.totalAmount.toFixed(2)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/merchandising/quotations/${row.original.id}`}>
                <IconExternalLink className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Convert to order"
              onClick={() => {
                setConverting(row.original)
                setConvertForm({
                  orderNo: `ORD-${row.original.quotationNo}`,
                  orderDate: new Date().toISOString().slice(0, 10),
                  totalOrderQty: row.original.lines?.[0]?.quantity ?? 0,
                  unitPrice: row.original.lines?.[0]?.unitPrice ?? 0,
                  currencyCode: "USD",
                })
                setConvertOpen(true)
              }}
            >
              <IconShoppingCart className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [buyers],
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileInvoice className="size-6" />}
        title="Quotations"
        description="Commercial offers and negotiation rounds"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              New Quotation
            </Button>
          </>
        }
      />

      <MerchFilterCard
        recordCount={quotations.length}
        onApply={() => setAppliedBuyerFilter(buyerFilter)}
        onReset={() => {
          setBuyerFilter("all")
          setAppliedBuyerFilter("all")
        }}
      >
        <MerchFilterField label="Buyer">
          <NativeSelect value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)}>
            <option value="all">All buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>{b.buyerName}</option>
            ))}
          </NativeSelect>
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading}>
        <DataTable columns={columns} data={quotations} searchKey="quotationNo" showTabs={false} showActions={false} />
      </MerchTableCard>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New Quotation</DialogTitle>
            <DialogDescription>Create a quotation with at least one line</DialogDescription>
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
                <Label className="text-xs">Quotation No</Label>
                <Input value={form.quotationNo} onChange={(e) => setForm((p) => ({ ...p, quotationNo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.quotationDate} onChange={(e) => setForm((p) => ({ ...p, quotationDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Line description</Label>
              <Input value={form.lineDescription} onChange={(e) => setForm((p) => ({ ...p, lineDescription: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Qty</Label>
                <Input type="number" value={form.lineQty} onChange={(e) => setForm((p) => ({ ...p, lineQty: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Unit price</Label>
                <Input type="number" value={form.linePrice} onChange={(e) => setForm((p) => ({ ...p, linePrice: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Order</DialogTitle>
            <DialogDescription>{converting?.quotationNo}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Order No</Label>
              <Input value={convertForm.orderNo} onChange={(e) => setConvertForm((p) => ({ ...p, orderNo: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Order Date</Label>
                <Input type="date" value={convertForm.orderDate} onChange={(e) => setConvertForm((p) => ({ ...p, orderDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Currency</Label>
                <Input value={convertForm.currencyCode} onChange={(e) => setConvertForm((p) => ({ ...p, currencyCode: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Total Qty</Label>
                <Input type="number" value={convertForm.totalOrderQty} onChange={(e) => setConvertForm((p) => ({ ...p, totalOrderQty: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Unit Price</Label>
                <Input type="number" value={convertForm.unitPrice} onChange={(e) => setConvertForm((p) => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvert}>Convert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
