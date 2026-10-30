"use client";

import * as React from "react";
import { IconPackage, IconLoader2, IconPlus } from "@tabler/icons-react";
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
import { SecurityPageShell, SecurityCompanyGate, SecurityDatePicker, todayIsoDate } from "@/components/security";
import { securityService } from "@/lib/services/security";
import type {
  GatePass,
  GatePassItem,
  ReturnableGatePassReturn,
  ReturnablePending,
} from "@/lib/types/security";

export default function ReturnableReturnsPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <ReturnableReturnsContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function ReturnableReturnsContent({ companyId }: { companyId: string }) {
  const [returns, setReturns] = React.useState<ReturnableGatePassReturn[]>([]);
  const [pending, setPending] = React.useState<ReturnablePending[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedPassId, setSelectedPassId] = React.useState("");
  const [gatePass, setGatePass] = React.useState<GatePass | null>(null);
  const [returnQtys, setReturnQtys] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState({
    returnDate: todayIsoDate(),
    returnedBy: "",
    remarks: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [returnRows, pendingRows] = await Promise.all([
        securityService.getReturnableReturns(companyId),
        securityService.getReturnablePending(companyId),
      ]);
      setReturns(returnRows);
      setPending(pendingRows);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load returnable returns");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const pendingByPass = React.useMemo(() => {
    const map = new Map<string, ReturnablePending[]>();
    for (const row of pending) {
      const list = map.get(row.gatePassId) ?? [];
      list.push(row);
      map.set(row.gatePassId, list);
    }
    return map;
  }, [pending]);

  const passOptions = Array.from(pendingByPass.keys());

  const loadGatePass = async (gatePassId: string) => {
    if (!gatePassId) {
      setGatePass(null);
      setReturnQtys({});
      return;
    }
    try {
      const gp = await securityService.getGatePassById(gatePassId);
      setGatePass(gp);
      const qtyMap: Record<string, string> = {};
      for (const item of gp.items ?? []) {
        const max = Math.max(0, item.quantity - item.returnedQty);
        qtyMap[item.id] = max > 0 ? String(max) : "0";
      }
      setReturnQtys(qtyMap);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load gate pass items");
    }
  };

  React.useEffect(() => {
    if (dialogOpen && selectedPassId) {
      loadGatePass(selectedPassId);
    }
  }, [dialogOpen, selectedPassId]);

  const maxReturnable = (item: GatePassItem) =>
    Math.max(0, item.quantity - item.returnedQty);

  const handleCreate = async () => {
    if (!selectedPassId || !gatePass) {
      toast.error("Select a gate pass");
      return;
    }
    const items = (gatePass.items ?? [])
      .map((item) => ({
        gatePassItemId: item.id,
        returnQty: parseFloat(returnQtys[item.id] ?? "0") || 0,
      }))
      .filter((i) => i.returnQty > 0);
    if (items.length === 0) {
      toast.error("Enter return quantity for at least one item");
      return;
    }
    for (const item of gatePass.items ?? []) {
      const qty = parseFloat(returnQtys[item.id] ?? "0") || 0;
      if (qty > maxReturnable(item)) {
        toast.error(`Return qty exceeds pending for ${item.itemName}`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await securityService.createReturnableReturn({
        companyId,
        gatePassId: selectedPassId,
        returnDate: form.returnDate,
        returnedBy: form.returnedBy.trim() || null,
        remarks: form.remarks.trim() || null,
        items,
      });
      toast.success("Return recorded");
      setDialogOpen(false);
      setSelectedPassId("");
      setGatePass(null);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to record return");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
            <IconPackage className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Returnable Returns</h1>
            <p className="text-sm text-muted-foreground">
              Record returns against outstanding returnable gate passes.
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={passOptions.length === 0}>
              <IconPlus className="size-4 mr-2" />
              Record return
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record returnable return</DialogTitle>
              <DialogDescription>
                Select a pending gate pass and enter return quantities per item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Gate pass</Label>
                <Select value={selectedPassId} onValueChange={setSelectedPassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pending pass" />
                  </SelectTrigger>
                  <SelectContent>
                    {passOptions.map((passId) => {
                      const first = pendingByPass.get(passId)?.[0];
                      return (
                        <SelectItem key={passId} value={passId}>
                          {first?.gatePassNo ?? passId}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Return date</Label>
                <SecurityDatePicker
                  value={form.returnDate}
                  onChange={(returnDate) => setForm({ ...form, returnDate })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Returned by</Label>
                <Input
                  value={form.returnedBy}
                  onChange={(e) => setForm({ ...form, returnedBy: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Remarks</Label>
                <Input
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>
              {gatePass && (
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">Items (max = pending qty)</p>
                  {(gatePass.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        {item.itemName}{" "}
                        <span className="text-muted-foreground">
                          (pending {maxReturnable(item)})
                        </span>
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={maxReturnable(item)}
                        className="w-24"
                        value={returnQtys[item.id] ?? ""}
                        onChange={(e) =>
                          setReturnQtys({ ...returnQtys, [item.id]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Saving…" : "Save return"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <TableHead>Return date</TableHead>
                <TableHead>Gate pass</TableHead>
                <TableHead>Returned by</TableHead>
                <TableHead className="text-right">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No returns recorded
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.returnDate}</TableCell>
                    <TableCell className="font-mono">{r.gatePassId.slice(0, 8)}…</TableCell>
                    <TableCell>{r.returnedBy || "—"}</TableCell>
                    <TableCell className="text-right">{r.items?.length ?? 0}</TableCell>
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
