"use client";

import * as React from "react";
import {
  IconFileDescription,
  IconLoader2,
  IconDeviceFloppy as IconSave,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { merchandisingService } from "@/lib/services/merchandising";
import type {
  Order,
  ColorSizeBreakdown,
  UpdateOrderRequest,
  CreateColorSizeBreakdownRequest,
} from "@/lib/types/merchandising";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MerchPageShell,
  MerchPageHeader,
  MerchCompanyGate,
  ColorSizeMatrixEditor,
  type EditableColorSizeRow,
} from "@/components/merchandising";

type BreakdownRow = EditableColorSizeRow & { isNew?: boolean };

function EditOrderPageContent({
  companyId,
  orderId,
}: {
  companyId: string;
  orderId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [shipmentDate, setShipmentDate] = React.useState<Date | undefined>();
  const [form, setForm] = React.useState({
    totalOrderQty: 0,
    unitPrice: 0,
    currencyCode: "USD",
  });
  const [breakdowns, setBreakdowns] = React.useState<BreakdownRow[]>([]);
  const [deletedIds, setDeletedIds] = React.useState<string[]>([]);

  const fetchData = React.useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const [orderData, breakdownData] = await Promise.all([
        merchandisingService.getOrderById(orderId, companyId),
        merchandisingService.getColorSizeBreakdown(orderId),
      ]);
      setOrder(orderData);
      setForm({
        totalOrderQty: orderData.totalOrderQty,
        unitPrice: orderData.unitPrice,
        currencyCode: orderData.currencyCode,
      });
      setShipmentDate(
        orderData.shipmentDate ? new Date(orderData.shipmentDate) : undefined,
      );
      setBreakdowns(
        breakdownData.map((b: ColorSizeBreakdown) => ({
          id: b.id,
          colorName: b.colorName,
          sizeName: b.sizeName,
          quantity: b.quantity,
        })),
      );
      setDeletedIds([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load order");
      router.replace("/merchandising/orders");
    } finally {
      setLoading(false);
    }
  }, [orderId, companyId, router]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBreakdownChange = (rows: EditableColorSizeRow[]) => {
    setBreakdowns((prev) => {
      const prevExistingIds = prev
        .filter((p) => p.id && !p.isNew)
        .map((p) => p.id!);
      const nextIds = rows.filter((r) => r.id).map((r) => r.id!);
      const removed = prevExistingIds.filter((id) => !nextIds.includes(id));
      if (removed.length > 0) {
        setDeletedIds((ids) => [...ids, ...removed]);
      }
      return rows.map((r) => {
        if (!r.id) return { ...r, isNew: true as const };
        const existing = prev.find((p) => p.id === r.id);
        if (existing?.isNew) return { ...r, isNew: true as const };
        return r;
      });
    });
  };

  const handleSubmit = async () => {
    if (!order) return;
    try {
      setSaving(true);
      const payload: UpdateOrderRequest = {
        shipmentDate: shipmentDate?.toISOString().slice(0, 10),
        totalOrderQty: form.totalOrderQty,
        unitPrice: form.unitPrice,
        currencyCode: form.currencyCode,
      };
      await merchandisingService.updateOrder(order.id, payload);

      for (const id of deletedIds) {
        await merchandisingService.deleteColorSizeBreakdown(id);
      }

      for (const row of breakdowns) {
        if (row.isNew) {
          if (!row.colorName.trim() || !row.sizeName.trim() || row.quantity <= 0)
            continue;
          const createPayload: CreateColorSizeBreakdownRequest = {
            companyId,
            colorName: row.colorName.trim(),
            sizeName: row.sizeName.trim(),
            quantity: row.quantity,
          };
          await merchandisingService.createColorSizeBreakdown(order.id, createPayload);
        } else if (row.id) {
          await merchandisingService.updateColorSizeBreakdown(row.id, {
            colorName: row.colorName,
            sizeName: row.sizeName,
            quantity: row.quantity,
          });
        }
      }

      toast.success("Order updated");
      router.push(`/merchandising/orders/details/${orderId}`);
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MerchPageShell>
        <div className="flex h-[60vh] items-center justify-center">
          <IconLoader2 className="animate-spin text-primary size-8" />
        </div>
      </MerchPageShell>
    );
  }

  if (!order) return null;

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileDescription className="size-6" />}
        title={`Edit Order (${order.orderNo})`}
        description="Update quantities, pricing, and breakdown"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/merchandising/orders/details/${orderId}`)}
            >
              <IconArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <IconLoader2 className="animate-spin mr-2 size-4" />
              ) : (
                <IconSave className="size-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        }
      />

      <Card className="border-none shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Order No</Label>
            <Input value={order.orderNo} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Status</Label>
            <Input value={order.orderStatus} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Shipment Date</Label>
            <DatePicker date={shipmentDate} setDate={setShipmentDate} className="h-9 w-full" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Total Qty</Label>
            <Input
              type="number"
              min="0"
              value={form.totalOrderQty || ""}
              onChange={(e) =>
                setForm({ ...form, totalOrderQty: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Unit Price</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice || ""}
              onChange={(e) =>
                setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Currency</Label>
            <Input
              value={form.currencyCode}
              onChange={(e) =>
                setForm({ ...form, currencyCode: e.target.value.toUpperCase() })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Color / Size Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ColorSizeMatrixEditor rows={breakdowns} onChange={handleBreakdownChange} />
        </CardContent>
      </Card>
    </MerchPageShell>
  );
}

export default function EditOrderPage() {
  const { id } = useParams();
  const orderId = id as string;

  return (
    <MerchCompanyGate>
      {(companyId) => (
        <EditOrderPageContent companyId={companyId} orderId={orderId} />
      )}
    </MerchCompanyGate>
  );
}
