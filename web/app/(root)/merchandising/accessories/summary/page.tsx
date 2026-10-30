"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPackage, IconRefresh, IconChevronRight } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Buyer, Order } from "@/lib/types/merchandising"

type SummaryFilters = {
  orderNo: string
  buyerId: string
  status: string
}

const defaultFilters = (): SummaryFilters => ({
  orderNo: "",
  buyerId: "all",
  status: "all",
})

export default function AccessoriesSummaryPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <AccessoriesSummaryContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function AccessoriesSummaryContent({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [buyers, setBuyers] = React.useState<Buyer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [draftFilters, setDraftFilters] = React.useState<SummaryFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<SummaryFilters>(defaultFilters)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const buyerId =
        appliedFilters.buyerId === "all" ? undefined : appliedFilters.buyerId
      const status =
        appliedFilters.status === "all" ? undefined : appliedFilters.status
      const [orderRows, buyerRows] = await Promise.all([
        merchandisingService.getOrders(companyId, buyerId, status),
        merchandisingService.getBuyers(companyId),
      ])
      setOrders(orderRows)
      setBuyers(buyerRows)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [companyId, appliedFilters.buyerId, appliedFilters.status])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const buyerName = (buyerId: string) =>
    buyers.find((b) => b.id === buyerId)?.buyerName ?? "—"

  const filtered = orders.filter((o) => {
    if (appliedFilters.orderNo.trim()) {
      const q = appliedFilters.orderNo.toLowerCase()
      if (!o.orderNo.toLowerCase().includes(q)) return false
    }
    return true
  })

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNo",
      header: "Order No",
      cell: ({ row }) => (
        <span className="font-bold text-primary text-sm">{row.original.orderNo}</span>
      ),
    },
    {
      id: "buyer",
      header: "Buyer",
      cell: ({ row }) => (
        <span className="text-sm">{buyerName(row.original.buyerId)}</span>
      ),
    },
    {
      accessorKey: "orderDate",
      header: "Order Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.orderDate), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "orderStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {row.original.orderStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "totalOrderQty",
      header: () => <span className="block text-right">Qty</span>,
      cell: ({ row }) => (
        <span className="block text-right font-bold tabular-nums">
          {row.original.totalOrderQty.toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() =>
            router.push(`/merchandising/accessories/summary/details/${row.original.id}`)
          }
        >
          Details <IconChevronRight className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconPackage className="size-6" />}
        title="Accessories Summary"
        description="Order-wise trims and accessories booking overview"
        actions={
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <IconRefresh className={loading ? "animate-spin size-4" : "size-4"} />
          </Button>
        }
      />

      <MerchFilterCard
        recordCount={filtered.length}
        isLoading={loading}
        onApply={() => setAppliedFilters(draftFilters)}
        onReset={() => {
          const reset = defaultFilters()
          setDraftFilters(reset)
          setAppliedFilters(reset)
        }}
      >
        <MerchFilterField label="Order no">
          <Input
            placeholder="Search order number..."
            value={draftFilters.orderNo}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, orderNo: e.target.value }))
            }
          />
        </MerchFilterField>
        <MerchFilterField label="Buyer">
          <NativeSelect
            value={draftFilters.buyerId}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, buyerId: e.target.value }))
            }
          >
            <option value="all">All buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyerName}
              </option>
            ))}
          </NativeSelect>
        </MerchFilterField>
        <MerchFilterField label="Status">
          <NativeSelect
            value={draftFilters.status}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="all">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </NativeSelect>
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading} loadingMessage="Loading orders...">
        <DataTable columns={columns} data={filtered} />
      </MerchTableCard>

      <p className="text-xs text-muted-foreground">
        Or open{" "}
        <Link href="/merchandising/bookings?type=trims" className="text-primary underline">
          trims bookings
        </Link>{" "}
        for full booking management.
      </p>
    </MerchPageShell>
  )
}
