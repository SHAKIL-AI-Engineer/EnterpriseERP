"use client";

import * as React from "react";
import {
  IconPackage,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type {
  BookingStatusReportRow,
  MaterialBooking,
  Order,
} from "@/lib/types/merchandising";

export default function InventoryPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <InventoryPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function InventoryPageContent({ companyId }: { companyId: string }) {
  const [report, setReport] = React.useState<
    (BookingStatusReportRow & { id: string })[]
  >([]);
  const [bookings, setBookings] = React.useState<MaterialBooking[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draftOrderId, setDraftOrderId] = React.useState("");
  const [appliedOrderId, setAppliedOrderId] = React.useState("");

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const orderFilter = appliedOrderId || undefined;
      const [reportRows, bookingRows, orderRows] = await Promise.all([
        merchandisingService.getBookingStatusReport(companyId, orderFilter),
        merchandisingService.getMaterialBookings(companyId, orderFilter),
        merchandisingService.getOrders(companyId),
      ]);
      setReport(
        reportRows.map((r) => ({ ...r, id: r.bookingId })),
      );
      setBookings(bookingRows);
      setOrders(orderRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, [companyId, appliedOrderId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const shortCount = report.filter(
    (r) => r.totalQty > 0 && r.bookedQty < r.totalQty,
  ).length;
  const completeCount = report.filter(
    (r) => r.totalQty > 0 && r.bookedQty >= r.totalQty,
  ).length;

  const reportColumns: ColumnDef<BookingStatusReportRow & { id: string }>[] = [
    {
      accessorKey: "orderNo",
      header: "Order",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.orderNo}</span>
      ),
    },
    {
      accessorKey: "bookingNo",
      header: "Booking",
    },
    {
      accessorKey: "bookingType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.bookingType}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      id: "progress",
      header: "Booked / required",
      cell: ({ row }) => {
        const pct =
          row.original.totalQty > 0
            ? Math.min(100, Math.round((row.original.bookedQty / row.original.totalQty) * 100))
            : 0;
        return (
          <div className="w-36 space-y-1">
            <div className="text-[10px] font-medium text-right">{pct}%</div>
            <Progress value={pct} className="h-1" />
            <p className="text-[10px] text-muted-foreground">
              {row.original.bookedQty.toLocaleString()} / {row.original.totalQty.toLocaleString()}
            </p>
          </div>
        );
      },
    },
  ];

  const bookingColumns: ColumnDef<MaterialBooking>[] = [
    {
      id: "order",
      header: "Order",
      cell: ({ row }) =>
        orders.find((o) => o.id === row.original.orderId)?.orderNo ??
        row.original.orderId.slice(0, 8),
    },
    { accessorKey: "bookingNo", header: "Booking no" },
    { accessorKey: "bookingType", header: "Type" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "totalQty",
      header: "Total qty",
      cell: ({ row }) => row.original.totalQty.toLocaleString(),
    },
  ];

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconPackage className="size-6" />}
        title="Inventory"
        description="Booking status report and material bookings from merchandising API"
        actions={
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <IconRefresh className={loading ? "size-4 animate-spin" : "size-4"} />
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Bookings" value={bookings.length} />
        <Stat title="Complete lines" value={completeCount} />
        <Stat title="Short / open" value={shortCount} icon={IconAlertTriangle} warn />
      </div>

      <MerchFilterCard
        recordCount={report.length}
        recordLabel="Report rows"
        onApply={() => setAppliedOrderId(draftOrderId)}
        onReset={() => {
          setDraftOrderId("");
          setAppliedOrderId("");
        }}
        isLoading={loading}
      >
        <MerchFilterField label="Order">
          <NativeSelect
            value={draftOrderId}
            onChange={(e) => setDraftOrderId(e.target.value)}
          >
            <option value="">All orders</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo}
              </option>
            ))}
          </NativeSelect>
        </MerchFilterField>
      </MerchFilterCard>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Booking status report</h2>
        <MerchTableCard isLoading={loading}>
          <div className="p-4">
            <DataTable
              columns={reportColumns}
              data={report}
              isLoading={loading}
              searchKey="orderNo"
              showTabs={false}
              showActions={false}
              showColumnCustomizer={false}
            />
          </div>
        </MerchTableCard>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Material bookings</h2>
        <MerchTableCard isLoading={loading}>
          <div className="p-4">
            <DataTable
              columns={bookingColumns}
              data={bookings}
              isLoading={loading}
              searchKey="bookingNo"
              showTabs={false}
              showActions={false}
              showColumnCustomizer={false}
            />
          </div>
        </MerchTableCard>
      </div>
    </MerchPageShell>
  );
}

function Stat({
  title,
  value,
  icon: Icon,
  warn,
}: {
  title: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
        {Icon ? <Icon className={warn ? "size-3 text-amber-600" : "size-3"} /> : null}
        {title}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
