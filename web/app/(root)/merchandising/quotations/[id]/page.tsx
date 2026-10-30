"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconRefresh,
  IconFileInvoice,
  IconShoppingCart,
  IconMessage,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  MerchTableCard,
  MerchEmptyState,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type {
  ConvertQuotationToOrderRequest,
  Quotation,
  QuotationLine,
  QuotationNegotiation,
} from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

export default function QuotationDetailPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <QuotationDetailContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function QuotationDetailContent({ companyId }: { companyId: string }) {
  const params = useParams()
  const router = useRouter()
  const quotationId = params.id as string

  const [quotation, setQuotation] = React.useState<Quotation | null>(null)
  const [negotiations, setNegotiations] = React.useState<QuotationNegotiation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [negotiationForm, setNegotiationForm] = React.useState({
    proposedAmount: 0,
    counterAmount: 0,
    notes: "",
  })
  const [editOpen, setEditOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState({ status: "Draft", validUntil: "" })
  const [convertOpen, setConvertOpen] = React.useState(false)
  const [convertForm, setConvertForm] = React.useState({
    orderNo: "",
    orderDate: new Date().toISOString().slice(0, 10),
    totalOrderQty: 0,
    unitPrice: 0,
    currencyCode: "USD",
  })

  const loadQuotation = React.useCallback(async () => {
    if (!quotationId) return
    try {
      setLoading(true)
      const [row, negotiationRows] = await Promise.all([
        merchandisingService.getQuotationById(quotationId, companyId),
        merchandisingService.getQuotationNegotiations(quotationId, companyId),
      ])
      setQuotation(row)
      setNegotiations(negotiationRows)
      setEditForm({
        status: row.status,
        validUntil: row.validUntil ? row.validUntil.slice(0, 10) : "",
      })
      setNegotiationForm((p) => ({ ...p, proposedAmount: row.totalAmount }))
      setConvertForm({
        orderNo: `ORD-${row.quotationNo}`,
        orderDate: new Date().toISOString().slice(0, 10),
        totalOrderQty: row.lines?.[0]?.quantity ?? 0,
        unitPrice: row.lines?.[0]?.unitPrice ?? 0,
        currencyCode: "USD",
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to load quotation")
    } finally {
      setLoading(false)
    }
  }, [companyId, quotationId])

  React.useEffect(() => {
    loadQuotation()
  }, [loadQuotation])

  const handleAddNegotiation = async () => {
    if (!quotation) return
    try {
      const created = await merchandisingService.addQuotationNegotiation(quotation.id, {
        proposedAmount: negotiationForm.proposedAmount,
        counterAmount: negotiationForm.counterAmount || undefined,
        notes: negotiationForm.notes || undefined,
      })
      setNegotiations((prev) => [...prev, created])
      setNegotiationForm((p) => ({ ...p, notes: "", counterAmount: 0 }))
      await loadQuotation()
      toast.success("Negotiation round added")
    } catch (error) {
      console.error(error)
      toast.error("Failed to add negotiation")
    }
  }

  const handleUpdateQuotation = async () => {
    if (!quotation) return
    try {
      const updated = await merchandisingService.updateQuotation(quotation.id, {
        status: editForm.status,
        validUntil: editForm.validUntil || undefined,
      })
      setQuotation(updated)
      setEditOpen(false)
      toast.success("Quotation updated")
    } catch (error) {
      console.error(error)
      toast.error("Failed to update quotation")
    }
  }

  const handleConvert = async () => {
    if (!quotation || !convertForm.orderNo.trim()) {
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
      const order = await merchandisingService.convertQuotationToOrder(quotation.id, payload)
      toast.success("Order created from quotation")
      router.push(`/merchandising/orders/details/${order.id}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to convert quotation")
    }
  }

  const lineColumns = React.useMemo<ColumnDef<QuotationLine>[]>(
    () => [
      { accessorKey: "itemDescription", header: "Description" },
      { accessorKey: "quantity", header: "Qty" },
      {
        accessorKey: "unitPrice",
        header: "Unit Price",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.unitPrice.toFixed(2)}</span>,
      },
      {
        accessorKey: "lineTotal",
        header: "Total",
        cell: ({ row }) => <span className="font-mono text-xs font-bold">{row.original.lineTotal.toFixed(2)}</span>,
      },
    ],
    [],
  )

  const negotiationColumns = React.useMemo<ColumnDef<QuotationNegotiation>[]>(
    () => [
      { accessorKey: "roundNo", header: "Round", cell: ({ row }) => <span className="font-mono">#{row.original.roundNo}</span> },
      {
        accessorKey: "proposedAmount",
        header: "Proposed",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.proposedAmount.toFixed(2)}</span>,
      },
      {
        accessorKey: "counterAmount",
        header: "Counter",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.counterAmount?.toFixed(2) ?? "—"}</span>
        ),
      },
      {
        accessorKey: "negotiatedAt",
        header: "When",
        cell: ({ row }) => format(new Date(row.original.negotiatedAt), "MMM dd, yyyy HH:mm"),
      },
      { accessorKey: "notes", header: "Notes", cell: ({ row }) => <span className="text-xs">{row.original.notes ?? "—"}</span> },
    ],
    [],
  )

  if (!loading && !quotation) {
    return (
      <MerchPageShell>
        <MerchEmptyState variant="empty" title="Quotation not found" />
      </MerchPageShell>
    )
  }

  const lines = quotation?.lines ?? []

  return (
    <MerchPageShell>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/merchandising/quotations">
          <IconArrowLeft className="size-4 mr-2" />
          Back to quotations
        </Link>
      </Button>

      <MerchPageHeader
        icon={<IconFileInvoice className="size-6" />}
        title={quotation?.quotationNo ?? "Quotation"}
        description={
          quotation
            ? `${format(new Date(quotation.quotationDate), "MMM dd, yyyy")} · ${quotation.status}`
            : undefined
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadQuotation} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} disabled={!quotation}>
              Edit
            </Button>
            <Button size="sm" onClick={() => setConvertOpen(true)} disabled={!quotation}>
              <IconShoppingCart className="size-4 mr-2" />
              Convert to Order
            </Button>
          </>
        }
      />

      {quotation ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{quotation.status}</Badge>
          <Badge variant="secondary" className="font-mono">
            Total: {quotation.totalAmount.toFixed(2)}
          </Badge>
          {quotation.validUntil ? (
            <Badge variant="outline">Valid until {format(new Date(quotation.validUntil), "MMM dd, yyyy")}</Badge>
          ) : null}
        </div>
      ) : null}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MerchTableCard isLoading={loading}>
            <DataTable columns={lineColumns} data={lines} showTabs={false} showActions={false} />
          </MerchTableCard>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <IconMessage className="size-4" />
            Negotiations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Proposed Amount</Label>
              <Input
                type="number"
                value={negotiationForm.proposedAmount}
                onChange={(e) => setNegotiationForm((p) => ({ ...p, proposedAmount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Counter Amount</Label>
              <Input
                type="number"
                value={negotiationForm.counterAmount}
                onChange={(e) => setNegotiationForm((p) => ({ ...p, counterAmount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input value={negotiationForm.notes} onChange={(e) => setNegotiationForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <Button size="sm" onClick={handleAddNegotiation} disabled={!quotation}>
            Add Negotiation Round
          </Button>

          {negotiations.length > 0 ? (
            <MerchTableCard>
              <DataTable columns={negotiationColumns} data={negotiations} showTabs={false} showActions={false} />
            </MerchTableCard>
          ) : (
            <p className="text-sm text-muted-foreground">No negotiation rounds recorded yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
            <DialogDescription>Update status and validity</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Input value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Valid Until</Label>
              <Input type="date" value={editForm.validUntil} onChange={(e) => setEditForm((p) => ({ ...p, validUntil: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateQuotation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Order</DialogTitle>
            <DialogDescription>Create a program order from this quotation</DialogDescription>
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
            <Button onClick={handleConvert}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
