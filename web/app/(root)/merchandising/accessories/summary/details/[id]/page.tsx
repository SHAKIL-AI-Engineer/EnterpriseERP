"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { IconArrowLeft, IconStack, IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AccessoryProcurementMatrix from "@/components/merchandising/AccessoryProcurementMatrix"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { MaterialBooking, Order } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

export default function AccessoryOrderSummaryDetailsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <AccessoryDetailsContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function AccessoryDetailsContent({ companyId }: { companyId: string }) {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = React.useState<Order | null>(null)
  const [bookings, setBookings] = React.useState<MaterialBooking[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    if (!orderId) return
    try {
      setLoading(true)
      const [o, trimsBookings, fabricBookings] = await Promise.all([
        merchandisingService.getOrderById(orderId, companyId),
        merchandisingService.getMaterialBookings(companyId, orderId, "Trims"),
        merchandisingService.getMaterialBookings(companyId, orderId, "Fabric"),
      ])
      setOrder(o)
      setBookings([...trimsBookings, ...fabricBookings])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load booking summary")
    } finally {
      setLoading(false)
    }
  }, [orderId, companyId])

  React.useEffect(() => {
    load()
  }, [load])

  const trimsBookings = bookings.filter((b) => b.bookingType.toLowerCase() === "trims")
  const fabricBookings = bookings.filter((b) => b.bookingType.toLowerCase() === "fabric")

  const trimsMatrix = React.useMemo(() => {
    const map = new Map<string, MaterialBooking[]>()
    for (const b of trimsBookings) {
      const key = b.bookingNo.split("-")[0] || b.bookingType
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [trimsBookings])

  return (
    <MerchPageShell>
      <Button variant="ghost" className="w-fit -mt-2" onClick={() => router.back()}>
        <IconArrowLeft className="mr-2 size-4" /> Back to summary
      </Button>

      <MerchPageHeader
        icon={<IconStack className="size-6" />}
        title={order?.orderNo ?? "Order"}
        description="Material bookings and trims procurement matrix"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/merchandising/bookings?orderId=${orderId}&type=trims`}>
              <IconExternalLink className="size-4 mr-2" />
              Open bookings
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Total bookings" value={String(bookings.length)} />
        <Stat label="Trims" value={String(trimsBookings.length)} />
        <Stat label="Fabric" value={String(fabricBookings.length)} />
      </div>

      <MerchTableCard isLoading={loading} loadingMessage="Loading bookings...">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-bold uppercase tracking-wider">All material bookings</p>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-bold">Booking No</TableHead>
              <TableHead className="text-xs font-bold">Type</TableHead>
              <TableHead className="text-xs font-bold text-right">Qty</TableHead>
              <TableHead className="text-xs font-bold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                  No bookings for this order
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-semibold text-sm text-primary">{b.bookingNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {b.bookingType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    {b.totalQty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </MerchTableCard>

      {trimsMatrix.length > 0 ? (
        <MerchTableCard>
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-bold uppercase tracking-wider">Trims matrix by category</p>
            <p className="text-xs text-muted-foreground">
              Grouped by booking prefix / accessory type
            </p>
          </div>
          <div className="divide-y">
            {trimsMatrix.map(([category, rows]) => {
              const totalQty = rows.reduce((s, r) => s + r.totalQty, 0)
              const confirmed = rows.filter(
                (r) => r.status === "Confirmed" || r.status === "FullyAllocated",
              ).length
              return (
                <div key={category} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm uppercase tracking-wide">{category}</span>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="secondary">{rows.length} bookings</Badge>
                      <Badge
                        className={cn(
                          confirmed === rows.length
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {confirmed}/{rows.length} confirmed
                      </Badge>
                      <span className="font-bold tabular-nums">{totalQty.toLocaleString()} qty</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {rows.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border bg-muted/20 px-3 py-2 text-xs flex justify-between"
                      >
                        <span className="font-medium">{r.bookingNo}</span>
                        <span className="text-muted-foreground">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </MerchTableCard>
      ) : null}

      <MerchTableCard>
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-bold uppercase tracking-wider">Procurement matrix</p>
          <p className="text-xs text-muted-foreground">Color/size worksheet with trims color specifications</p>
        </div>
        <div className="p-4">
          <AccessoryProcurementMatrix companyId={companyId} orderId={orderId} title="Trims" />
        </div>
      </MerchTableCard>
    </MerchPageShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3 shadow-sm">
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}
