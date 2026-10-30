"use client";

import * as React from "react";
import {
  IconFileDescription,
  IconLoader2,
  IconDeviceFloppy as IconSave,
  IconArrowLeft,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { merchandisingService } from "@/lib/services/merchandising";
import type {
  Buyer,
  Style,
  CreateColorSizeBreakdownRequest,
} from "@/lib/types/merchandising";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MerchPageShell,
  MerchPageHeader,
  MerchCompanyGate,
  ColorSizeMatrixEditor,
  type EditableColorSizeRow,
} from "@/components/merchandising";

function CreateOrderPageContent({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [buyers, setBuyers] = React.useState<Buyer[]>([]);
  const [styles, setStyles] = React.useState<Style[]>([]);
  const [orderDate, setOrderDate] = React.useState<Date | undefined>(new Date());
  const [shipmentDate, setShipmentDate] = React.useState<Date | undefined>();
  const [form, setForm] = React.useState({
    orderNo: "",
    buyerId: "",
    styleId: "",
    totalOrderQty: 0,
    unitPrice: 0,
    currencyCode: "USD",
  });
  const [breakdowns, setBreakdowns] = React.useState<EditableColorSizeRow[]>([
    { colorName: "", sizeName: "M", quantity: 0 },
  ]);

  React.useEffect(() => {
    merchandisingService
      .getBuyers(companyId)
      .then(setBuyers)
      .catch(() => toast.error("Failed to load buyers"))
      .finally(() => setPageLoading(false));
  }, [companyId]);

  const handleBuyerChange = async (buyerId: string) => {
    setForm((prev) => ({ ...prev, buyerId, styleId: "" }));
    if (buyerId) {
      try {
        setStyles(await merchandisingService.getStyles(companyId, buyerId));
      } catch {
        toast.error("Failed to load styles");
        setStyles([]);
      }
    } else {
      setStyles([]);
    }
  };

  const breakdownTotal = breakdowns.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const createOrderWithBreakdowns = async (confirmAfterCreate: boolean) => {
    if (!form.orderNo.trim() || !form.buyerId || !form.styleId) {
      toast.error("Order number, buyer, and style are required");
      return;
    }
    const totalQty = breakdownTotal > 0 ? breakdownTotal : form.totalOrderQty;
    if (totalQty <= 0) {
      toast.error("Total quantity must be greater than zero");
      return;
    }
    try {
      setLoading(true);
      const order = await merchandisingService.createOrder({
        companyId,
        buyerId: form.buyerId,
        styleId: form.styleId,
        orderNo: form.orderNo.trim(),
        orderDate: (orderDate ?? new Date()).toISOString().slice(0, 10),
        shipmentDate: shipmentDate?.toISOString().slice(0, 10),
        totalOrderQty: totalQty,
        unitPrice: form.unitPrice,
        currencyCode: form.currencyCode,
      });

      const validRows = breakdowns.filter(
        (r) => r.colorName.trim() && r.sizeName.trim() && r.quantity > 0,
      );
      for (const row of validRows) {
        const payload: CreateColorSizeBreakdownRequest = {
          companyId,
          colorName: row.colorName.trim(),
          sizeName: row.sizeName.trim(),
          quantity: row.quantity,
        };
        await merchandisingService.createColorSizeBreakdown(order.id, payload);
      }

      if (confirmAfterCreate) {
        await merchandisingService.confirmOrder(order.id);
        toast.success("Order created and confirmed");
      } else {
        toast.success("Order created");
      }
      router.push(`/merchandising/orders/details/${order.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MerchPageShell>
        <div className="flex h-[60vh] items-center justify-center">
          <IconLoader2 className="animate-spin text-primary size-8" />
        </div>
      </MerchPageShell>
    );
  }

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileDescription className="size-6" />}
        title="New Order"
        description="Create a merchandising order with color/size breakdown"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/merchandising/orders")}>
              <IconArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => createOrderWithBreakdowns(true)}
            >
              {loading ? (
                <IconLoader2 className="animate-spin mr-2 size-4" />
              ) : (
                <IconCheck className="size-4 mr-2" />
              )}
              Save & Confirm
            </Button>
            <Button size="sm" disabled={loading} onClick={() => createOrderWithBreakdowns(false)}>
              {loading ? (
                <IconLoader2 className="animate-spin mr-2 size-4" />
              ) : (
                <IconSave className="size-4 mr-2" />
              )}
              Save Order
            </Button>
          </div>
        }
      />

      <Card className="border-none shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Order Header
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Order No</Label>
            <Input
              value={form.orderNo}
              onChange={(e) =>
                setForm({ ...form, orderNo: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Buyer</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.buyerId}
              onChange={(e) => handleBuyerChange(e.target.value)}
            >
              <option value="">Select Buyer</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.buyerName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Style</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.styleId}
              disabled={!form.buyerId}
              onChange={(e) => setForm({ ...form, styleId: e.target.value })}
            >
              <option value="">Select Style</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.styleNo}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Order Date</Label>
            <DatePicker date={orderDate} setDate={setOrderDate} className="h-9 w-full" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Shipment Date</Label>
            <DatePicker date={shipmentDate} setDate={setShipmentDate} className="h-9 w-full" />
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
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Total Qty (if no breakdown)</Label>
            <Input
              type="number"
              min="0"
              value={form.totalOrderQty || ""}
              onChange={(e) =>
                setForm({ ...form, totalOrderQty: parseInt(e.target.value) || 0 })
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
          <ColorSizeMatrixEditor rows={breakdowns} onChange={setBreakdowns} />
        </CardContent>
      </Card>
    </MerchPageShell>
  );
}

export default function CreateOrderPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <CreateOrderPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}
