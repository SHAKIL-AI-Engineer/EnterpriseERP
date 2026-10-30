"use client";

import * as React from "react";
import {
  IconCurrencyDollar,
  IconRefresh,
  IconBuildingBank,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, OrderDetails } from "@/lib/types/merchandising";

type PaymentRow = {
  id: string;
  order: Order;
  buyerName: string;
  paymentTerms: string;
  incoterms: string;
  lcBank: string;
  currency: string;
};

export default function PaymentSheetPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <PaymentSheetPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function PaymentSheetPageContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<PaymentRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [orders, buyers] = await Promise.all([
        merchandisingService.getOrders(companyId),
        merchandisingService.getBuyers(companyId),
      ]);
      const buyerMap = new Map(buyers.map((b) => [b.id, b]));

      const paymentRows: PaymentRow[] = await Promise.all(
        orders.map(async (order) => {
          const buyer = buyerMap.get(order.buyerId);
          let paymentTerms = buyer?.paymentTerms ?? "—";
          let incoterms = "—";
          const lcBank = "—";

          try {
            const details: OrderDetails = await merchandisingService.getOrderDetails(
              order.id,
            );
            const shipment = details.shipmentPlans?.[0];
            if (shipment?.destination) {
              incoterms = shipment.destination;
            }
          } catch {
            /* use buyer defaults only */
          }

          if (paymentTerms === "—" && buyer) {
            paymentTerms = buyer.paymentTerms ?? buyer.currency ?? "—";
          }

          return {
            id: order.id,
            order,
            buyerName: buyer?.buyerName ?? "—",
            paymentTerms,
            incoterms,
            lcBank,
            currency: order.currencyCode || buyer?.currency || "USD",
          };
        }),
      );

      setRows(paymentRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payment sheet");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalValue = rows.reduce((acc, r) => acc + r.order.totalValue, 0);

  const columns: ColumnDef<PaymentRow>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      id: "orderNo",
      header: "Order",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.order.orderNo}</span>
      ),
    },
    {
      id: "buyer",
      header: "Buyer",
      cell: ({ row }) => row.original.buyerName,
    },
    {
      id: "terms",
      header: "Payment terms",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.paymentTerms}</span>
      ),
    },
    {
      id: "bank",
      header: "L/C bank",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-xs">
          <IconBuildingBank className="size-3.5 text-muted-foreground" />
          {row.original.lcBank}
        </div>
      ),
    },
    {
      id: "value",
      header: "Order value",
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">
          {row.original.currency} {row.original.order.totalValue.toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: "Order status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] uppercase">
          {row.original.order.orderStatus}
        </Badge>
      ),
    },
  ];

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconCurrencyDollar className="size-6" />}
        title="Payment sheet"
        description="Commercial terms from orders and buyer master — no synthetic invoice IDs"
        actions={
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <IconRefresh className={loading ? "size-4 animate-spin" : "size-4"} />
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Orders" value={rows.length} />
        <Stat title="Total value" value={totalValue.toLocaleString()} />
        <Stat
          title="Confirmed"
          value={rows.filter((r) => r.order.orderStatus === "Confirmed").length}
        />
      </div>

      <MerchTableCard isLoading={loading}>
        <div className="p-4">
          <DataTable
            columns={columns}
            data={rows}
            isLoading={loading}
            searchKey="order"
            showTabs={false}
            showActions={false}
            showColumnCustomizer
          />
        </div>
      </MerchTableCard>
    </MerchPageShell>
  );
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">{title}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
