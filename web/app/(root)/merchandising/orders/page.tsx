"use client";

import * as React from "react";
import {
  IconFileDescription,
  IconPlus,
  IconCalendar,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
  IconUpload,
  IconChartBar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, Buyer, Style } from "@/lib/types/merchandising";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
  MerchCompanyGate,
} from "@/components/merchandising";

type OrderFilters = {
  orderNo: string;
  buyerId: string;
  status: string;
  fromDate: Date | undefined;
  toDate: Date | undefined;
  minQty: string;
  maxQty: string;
};

const defaultFilters = (): OrderFilters => ({
  orderNo: "",
  buyerId: "all",
  status: "all",
  fromDate: undefined,
  toDate: undefined,
  minQty: "",
  maxQty: "",
});

function OrdersPageContent({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [buyers, setBuyers] = React.useState<Buyer[]>([]);
  const [styles, setStyles] = React.useState<Style[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draftFilters, setDraftFilters] = React.useState<OrderFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = React.useState<OrderFilters>(defaultFilters);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const status =
        appliedFilters.status === "all" ? undefined : appliedFilters.status;
      const buyerId =
        appliedFilters.buyerId === "all" ? undefined : appliedFilters.buyerId;
      const [ordersData, buyersData, stylesData] = await Promise.all([
        merchandisingService.getOrders(companyId, buyerId, status),
        merchandisingService.getBuyers(companyId),
        merchandisingService.getStyles(companyId),
      ]);
      setOrders(ordersData);
      setBuyers(buyersData);
      setStyles(stylesData);
    } catch (error) {
      console.error("Order fetch error:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [companyId, appliedFilters.status, appliedFilters.buyerId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buyerName = (buyerId: string) =>
    buyers.find((b) => b.id === buyerId)?.buyerName ?? "—";
  const styleNo = (styleId: string) =>
    styles.find((s) => s.id === styleId)?.styleNo ?? "—";

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const orderNo = order.orderNo.toLowerCase();
      const orderDate = order.orderDate ? new Date(order.orderDate) : null;
      const matchesOrderNo =
        !appliedFilters.orderNo ||
        orderNo.includes(appliedFilters.orderNo.toLowerCase());
      const fromDate = appliedFilters.fromDate ?? null;
      const toDate = appliedFilters.toDate ?? null;
      const matchesFromDate =
        !fromDate || (orderDate !== null && orderDate >= fromDate);
      const matchesToDate =
        !toDate || (orderDate !== null && orderDate <= toDate);
      const minQty = appliedFilters.minQty ? Number(appliedFilters.minQty) : null;
      const maxQty = appliedFilters.maxQty ? Number(appliedFilters.maxQty) : null;
      const matchesMinQty =
        minQty === null || order.totalOrderQty >= minQty;
      const matchesMaxQty =
        maxQty === null || order.totalOrderQty <= maxQty;
      return (
        matchesOrderNo &&
        matchesFromDate &&
        matchesToDate &&
        matchesMinQty &&
        matchesMaxQty
      );
    });
  }, [orders, appliedFilters]);

  const handleApply = () => {
    setAppliedFilters({ ...draftFilters });
  };

  const handleReset = () => {
    const reset = defaultFilters();
    setDraftFilters(reset);
    setAppliedFilters(reset);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this order?")) return;
    try {
      await merchandisingService.cancelOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Order cancelled");
    } catch (error) {
      console.error(error);
      toast.error("Cancel failed");
    }
  };

  const handleExport = async (id: string) => {
    try {
      await merchandisingService.exportOrder(id);
      toast.success("Export started");
    } catch {
      toast.error("Export failed");
    }
  };

  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "sl",
        header: "SL",
        cell: ({ row }) => (
          <div data-no-row-click="true">
            <span className="text-[10px] font-bold text-muted-foreground/60">
              {(row.index + 1).toString().padStart(2, "0")}
            </span>
          </div>
        ),
        size: 50,
      },
      {
        accessorKey: "orderNo",
        header: "Order No",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold">{row.getValue("orderNo")}</span>
            <span className="text-[10px] text-muted-foreground">
              {styleNo(row.original.styleId)}
            </span>
          </div>
        ),
      },
      {
        id: "buyer",
        header: "Buyer",
        cell: ({ row }) => (
          <span className="font-semibold">{buyerName(row.original.buyerId)}</span>
        ),
      },
      {
        accessorKey: "orderStatus",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] uppercase">
            {row.getValue("orderStatus")}
          </Badge>
        ),
      },
      {
        accessorKey: "totalOrderQty",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => (
          <div className="text-right font-bold">
            {row.original.totalOrderQty.toLocaleString()}{" "}
            <span className="text-[10px] text-muted-foreground">PCS</span>
          </div>
        ),
      },
      {
        accessorKey: "totalValue",
        header: () => <div className="text-right">Value</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs">
            {row.original.currencyCode}{" "}
            {row.original.totalValue.toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "orderDate",
        header: "Date",
        cell: ({ row }) => {
          const d = new Date(row.getValue("orderDate") as string);
          return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconCalendar className="size-3.5" />
              {isNaN(d.getTime()) ? "N/A" : format(d, "dd MMM, yy")}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex justify-end" data-no-row-click="true">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <IconDotsVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/merchandising/orders/details/${order.id}`);
                    }}
                  >
                    <IconEye className="size-4 mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/merchandising/orders/edit/${order.id}`);
                    }}
                  >
                    <IconEdit className="size-4 mr-2" /> Edit Order
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(order.id);
                    }}
                  >
                    <IconDownload className="size-4 mr-2" /> Export
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(order.id);
                    }}
                    className="text-red-500"
                  >
                    <IconTrash className="size-4 mr-2" /> Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, buyers, styles],
  );

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileDescription className="size-6" />}
        title="Merchandising Orders"
        description="Manage production orders and color/size breakdowns"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/merchandising/orders/summary")}
            >
              <IconChartBar className="size-4 mr-2" /> Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/merchandising/orders/import")}
            >
              <IconUpload className="size-4 mr-2" /> Import
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/merchandising/orders/create")}
            >
              <IconPlus className="size-4 mr-2" /> Create Order
            </Button>
          </>
        }
      />

      <MerchFilterCard
        recordCount={filteredOrders.length}
        recordLabel="Orders"
        isLoading={loading}
        onApply={handleApply}
        onReset={handleReset}
      >
        <MerchFilterField label="Order No">
          <Input
            placeholder="Search order no..."
            value={draftFilters.orderNo}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, orderNo: e.target.value }))
            }
          />
        </MerchFilterField>
        <MerchFilterField label="Buyer">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draftFilters.buyerId}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, buyerId: e.target.value }))
            }
          >
            <option value="all">All Buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyerName}
              </option>
            ))}
          </select>
        </MerchFilterField>
        <MerchFilterField label="Status">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draftFilters.status}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </MerchFilterField>
        <MerchFilterField label="From Date">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start font-normal h-9 w-full">
                <IconCalendar className="mr-2 size-4" />
                {draftFilters.fromDate
                  ? format(draftFilters.fromDate, "dd MMM, yyyy")
                  : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={draftFilters.fromDate}
                onSelect={(date) =>
                  setDraftFilters((p) => ({ ...p, fromDate: date }))
                }
              />
            </PopoverContent>
          </Popover>
        </MerchFilterField>
        <MerchFilterField label="To Date">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start font-normal h-9 w-full">
                <IconCalendar className="mr-2 size-4" />
                {draftFilters.toDate
                  ? format(draftFilters.toDate, "dd MMM, yyyy")
                  : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={draftFilters.toDate}
                onSelect={(date) =>
                  setDraftFilters((p) => ({ ...p, toDate: date }))
                }
              />
            </PopoverContent>
          </Popover>
        </MerchFilterField>
        <MerchFilterField label="Min Qty">
          <Input
            type="number"
            placeholder="Min"
            value={draftFilters.minQty}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, minQty: e.target.value }))
            }
          />
        </MerchFilterField>
        <MerchFilterField label="Max Qty">
          <Input
            type="number"
            placeholder="Max"
            value={draftFilters.maxQty}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, maxQty: e.target.value }))
            }
          />
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading} loadingMessage="Loading orders...">
        <DataTable
          data={filteredOrders}
          columns={columns}
          onRowClick={(row) =>
            router.push(`/merchandising/orders/details/${row.id}`)
          }
          enableSelection
          enableDrag
        />
      </MerchTableCard>
    </MerchPageShell>
  );
}

export default function OrdersPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <OrdersPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}
