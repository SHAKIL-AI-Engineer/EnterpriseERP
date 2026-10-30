"use client";

import * as React from "react";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, ProgramOrderWorksheet } from "@/lib/types/merchandising";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconLoader2,
  IconTableAlias,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MerchPageShell,
  MerchPageHeader,
  MerchCompanyGate,
  MerchEmptyState,
} from "@/components/merchandising";

function OrderWorksheetPageContent({ companyId }: { companyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") ?? "";

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState(initialOrderId);
  const [worksheet, setWorksheet] = React.useState<ProgramOrderWorksheet | null>(null);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [worksheetLoading, setWorksheetLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setOrdersLoading(true);
        const data = await merchandisingService.getOrders(companyId);
        if (cancelled) return;
        setOrders(data);
        setSelectedOrderId((current) => {
          if (current) return current;
          if (initialOrderId) return initialOrderId;
          return data.length > 0 ? data[0].id : "";
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load orders");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, initialOrderId]);

  React.useEffect(() => {
    if (!selectedOrderId) {
      setWorksheet(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setWorksheetLoading(true);
        const data = await merchandisingService.getOrderWorksheet(selectedOrderId);
        if (!cancelled) setWorksheet(data);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          toast.error("Failed to load worksheet");
          setWorksheet(null);
        }
      } finally {
        if (!cancelled) setWorksheetLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  const programTotal =
    worksheet?.articles.reduce((acc, item) => acc + item.totalQty, 0) ?? 0;

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconTableAlias className="size-6" />}
        title="Order Worksheet"
        description="Program breakdown for a single order"
        actions={
          <>
            <Link href="/merchandising/orders">
              <Button variant="outline" size="sm">
                <IconArrowLeft className="size-4 mr-2" /> Back
              </Button>
            </Link>
            {selectedOrderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/merchandising/orders/details/${selectedOrderId}`)
                }
              >
                Open Order
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex flex-col gap-1.5 min-w-[240px]">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
            Select Order
          </Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={selectedOrderId}
            disabled={ordersLoading}
            onChange={(e) => setSelectedOrderId(e.target.value)}
          >
            <option value="">Choose an order...</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo} ({o.orderStatus})
              </option>
            ))}
          </select>
        </div>
        {worksheet && (
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{worksheet.programNumber}</Badge>
            <Badge variant="outline">{worksheet.buyerName}</Badge>
            <Badge variant="outline">{worksheet.orderStatus}</Badge>
          </div>
        )}
      </div>

      {ordersLoading || worksheetLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <IconLoader2 className="size-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading worksheet...</span>
        </div>
      ) : !selectedOrderId ? (
        <MerchEmptyState
          variant="empty"
          title="Select an order"
          description="Choose an order from the dropdown to view its worksheet."
        />
      ) : !worksheet ? (
        <MerchEmptyState
          variant="empty"
          title="No worksheet data"
          description="This order has no worksheet breakdown available."
        />
      ) : (
        <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <p className="font-bold">{worksheet.programNumber}</p>
            <p className="text-xs text-muted-foreground">
              {worksheet.buyerName}
              {worksheet.fabricDescription ? ` · ${worksheet.fabricDescription}` : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="bg-primary text-primary-foreground font-bold uppercase text-[10px]">
                  <th className="p-2 border-r">SL</th>
                  <th className="p-2 border-r">Style</th>
                  <th className="p-2 border-r">Color</th>
                  <th className="p-2 border-r">Size</th>
                  <th className="p-2 border-r">Qty</th>
                  <th className="p-2">Pack Ref</th>
                </tr>
              </thead>
              <tbody>
                {worksheet.articles.flatMap((article, articleIdx) =>
                  article.colors.flatMap((color) =>
                    color.sizeBreakdowns.map((sb, sbIdx) => (
                      <tr
                        key={`${article.styleNo}-${color.colorName}-${sb.sizeName}-${sbIdx}`}
                        className="border-b hover:bg-muted/30"
                      >
                        <td className="p-2 text-center">{articleIdx + 1}</td>
                        <td className="p-2 font-bold">{article.styleNo}</td>
                        <td className="p-2">{color.colorName}</td>
                        <td className="p-2 text-center">{sb.sizeName}</td>
                        <td className="p-2 text-center font-bold">{sb.quantity}</td>
                        <td className="p-2 text-center text-muted-foreground">
                          {sb.buyerPackingNumber || "—"}
                        </td>
                      </tr>
                    )),
                  ),
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-bold">
                  <td colSpan={4} className="p-3 text-right uppercase text-[10px]">
                    Grand Total
                  </td>
                  <td className="p-3 text-center">{programTotal.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </MerchPageShell>
  );
}

export default function OrderWorksheetPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <OrderWorksheetPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}
