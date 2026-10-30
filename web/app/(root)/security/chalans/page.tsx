"use client";

import * as React from "react";
import Link from "next/link";
import { IconTruckDelivery, IconLoader2, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  SecurityStatusBadge,
  LineItemsEditor,
  lineItemsToChalanPayload,
  SecurityDatePicker,
  todayIsoDate,
} from "@/components/security";
import type { LineItemRow } from "@/components/security";
import { securityService } from "@/lib/services/security";
import { merchandisingService } from "@/lib/services/merchandising";
import { storeService } from "@/lib/services/store";
import type { Chalan } from "@/lib/types/security";
import { CHALAN_TYPES } from "@/lib/types/security";
import type { Buyer, Order } from "@/lib/types/merchandising";
import type { StoreBuyer, StoreOrder } from "@/lib/types/store";

type BuyerOption = { id: string; label: string; source: string };
type OrderOption = { id: string; label: string; source: string };

export default function ChalansPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <ChalansContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function ChalansContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<Chalan[]>([]);
  const [buyers, setBuyers] = React.useState<BuyerOption[]>([]);
  const [orders, setOrders] = React.useState<OrderOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [lineItems, setLineItems] = React.useState<LineItemRow[]>([
    { itemName: "", unitName: "", quantity: "1", remarks: "" },
  ]);
  const [form, setForm] = React.useState({
    chalanNo: "",
    chalanDate: todayIsoDate(),
    chalanType: "Delivery",
    buyerId: "",
    orderId: "",
    vehicleNo: "",
    driverName: "",
    remarks: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [chalans, merchBuyers, storeBuyers, merchOrders, storeOrders] = await Promise.all([
        securityService.getChalans(
          companyId,
          typeFilter === "all" ? undefined : typeFilter,
          fromDate || undefined,
          toDate || undefined,
        ),
        merchandisingService.getBuyers(companyId),
        storeService.getBuyers(companyId),
        merchandisingService.getOrders(companyId),
        storeService.getOrders(companyId),
      ]);
      setRows(chalans);
      const buyerOpts: BuyerOption[] = [
        ...merchBuyers.map((b: Buyer) => ({
          id: b.id,
          label: `${b.buyerName} (Merch)`,
          source: "merch",
        })),
        ...storeBuyers.map((b: StoreBuyer) => ({
          id: b.id,
          label: `${b.buyerName} (Store)`,
          source: "store",
        })),
      ];
      const orderOpts: OrderOption[] = [
        ...merchOrders.map((o: Order) => ({
          id: o.id,
          label: `${o.orderNo} (Merch)`,
          source: "merch",
        })),
        ...storeOrders.map((o: StoreOrder) => ({
          id: o.id,
          label: `${o.orderNumber} (Store)`,
          source: "store",
        })),
      ];
      setBuyers(buyerOpts);
      setOrders(orderOpts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load chalans");
    } finally {
      setLoading(false);
    }
  }, [companyId, typeFilter, fromDate, toDate]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.chalanNo.trim()) {
      toast.error("Chalan number is required");
      return;
    }
    const items = lineItemsToChalanPayload(lineItems);
    if (items.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    setSubmitting(true);
    try {
      await securityService.createChalan({
        companyId,
        chalanNo: form.chalanNo.trim(),
        chalanDate: form.chalanDate,
        chalanType: form.chalanType,
        buyerId: form.buyerId || null,
        orderId: form.orderId || null,
        vehicleNo: form.vehicleNo.trim() || null,
        driverName: form.driverName.trim() || null,
        remarks: form.remarks.trim() || null,
        items,
      });
      toast.success("Chalan created");
      setDialogOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create chalan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <IconTruckDelivery className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chalans</h1>
            <p className="text-sm text-muted-foreground">Delivery and receive challans.</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="size-4 mr-2" />
              New chalan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create chalan</DialogTitle>
              <DialogDescription>Link buyer/order and add line items.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Chalan no</Label>
                <Input
                  value={form.chalanNo}
                  onChange={(e) => setForm({ ...form, chalanNo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <SecurityDatePicker
                  value={form.chalanDate}
                  onChange={(chalanDate) => setForm({ ...form, chalanDate })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={form.chalanType}
                  onValueChange={(v) => setForm({ ...form, chalanType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHALAN_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Buyer</Label>
                <Select
                  value={form.buyerId || "none"}
                  onValueChange={(v) => setForm({ ...form, buyerId: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {buyers.map((b) => (
                      <SelectItem key={`${b.source}-${b.id}`} value={b.id}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Order</Label>
                <Select
                  value={form.orderId || "none"}
                  onValueChange={(v) => setForm({ ...form, orderId: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {orders.map((o) => (
                      <SelectItem key={`${o.source}-${o.id}`} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Vehicle</Label>
                <Input
                  value={form.vehicleNo}
                  onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Driver</Label>
                <Input
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                />
              </div>
            </div>
            <LineItemsEditor items={lineItems} onChange={setLineItems} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Saving…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="grid gap-1">
          <Label className="text-xs">Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {CHALAN_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">From</Label>
          <SecurityDatePicker className="w-[200px]" value={fromDate} onChange={setFromDate} placeholder="From" />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">To</Label>
          <SecurityDatePicker className="w-[200px]" value={toDate} onChange={setToDate} placeholder="To" />
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Apply filters
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Chalan no</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No chalans found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/security/chalans/${c.id}`}
                        className="font-medium text-erp-accent hover:underline"
                      >
                        {c.chalanNo}
                      </Link>
                    </TableCell>
                    <TableCell>{c.chalanDate}</TableCell>
                    <TableCell>{c.chalanType}</TableCell>
                    <TableCell>
                      <SecurityStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">{c.items?.length ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
