"use client";

import * as React from "react";
import Link from "next/link";
import { IconFileDescription, IconLoader2, IconPlus } from "@tabler/icons-react";
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
  lineItemsToGatePassPayload,
  SecurityDatePicker,
  todayIsoDate,
} from "@/components/security";
import type { LineItemRow } from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { Gate, GatePass, GatePassStatus } from "@/lib/types/security";
import { GATE_PASS_TYPES } from "@/lib/types/security";

const STATUSES: GatePassStatus[] = [
  "Draft",
  "Submitted",
  "Approved",
  "Issued",
  "Completed",
  "Cancelled",
  "Hold",
];

export default function GatePassesPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <GatePassesContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function GatePassesContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<GatePass[]>([]);
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [lineItems, setLineItems] = React.useState<LineItemRow[]>([
    { itemName: "", unitName: "", quantity: "1", remarks: "" },
  ]);
  const [form, setForm] = React.useState({
    gateId: "",
    gatePassNo: "",
    gatePassDate: todayIsoDate(),
    gatePassType: "MaterialOut",
    direction: "OUT",
    isReturnable: false,
    expectedReturnDate: "",
    vehicleNo: "",
    driverName: "",
    purpose: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [passes, gateList] = await Promise.all([
        securityService.getGatePasses(
          companyId,
          typeFilter === "all" ? undefined : typeFilter,
          statusFilter === "all" ? undefined : statusFilter,
          fromDate || undefined,
          toDate || undefined,
        ),
        securityService.getGates(companyId),
      ]);
      setRows(passes);
      setGates(gateList.filter((g) => g.isActive));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load gate passes");
    } finally {
      setLoading(false);
    }
  }, [companyId, typeFilter, statusFilter, fromDate, toDate]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.gateId || !form.gatePassNo.trim()) {
      toast.error("Gate and pass number are required");
      return;
    }
    const items = lineItemsToGatePassPayload(lineItems);
    if (items.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    setSubmitting(true);
    try {
      await securityService.createGatePass({
        companyId,
        gateId: form.gateId,
        gatePassNo: form.gatePassNo.trim(),
        gatePassDate: form.gatePassDate,
        gatePassType: form.gatePassType,
        direction: form.direction,
        isReturnable: form.isReturnable,
        expectedReturnDate: form.expectedReturnDate || null,
        vehicleNo: form.vehicleNo.trim() || null,
        driverName: form.driverName.trim() || null,
        purpose: form.purpose.trim() || null,
        items,
      });
      toast.success("Gate pass created");
      setDialogOpen(false);
      setForm({
        gateId: gates[0]?.id ?? "",
        gatePassNo: "",
        gatePassDate: todayIsoDate(),
        gatePassType: "MaterialOut",
        direction: "OUT",
        isReturnable: false,
        expectedReturnDate: "",
        vehicleNo: "",
        driverName: "",
        purpose: "",
      });
      setLineItems([{ itemName: "", unitName: "", quantity: "1", remarks: "" }]);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create gate pass");
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (gates.length && !form.gateId) {
      setForm((f) => ({ ...f, gateId: gates[0].id }));
    }
  }, [gates, form.gateId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
            <IconFileDescription className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gate Passes</h1>
            <p className="text-sm text-muted-foreground">
              Material and goods movement authorization.
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="size-4 mr-2" />
              New gate pass
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create gate pass</DialogTitle>
              <DialogDescription>Draft a new gate pass with line items.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Gate</Label>
                <Select value={form.gateId} onValueChange={(v) => setForm({ ...form, gateId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gate" />
                  </SelectTrigger>
                  <SelectContent>
                    {gates.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.gateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Pass number</Label>
                <Input
                  value={form.gatePassNo}
                  onChange={(e) => setForm({ ...form, gatePassNo: e.target.value })}
                  placeholder="GP-2026-001"
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <SecurityDatePicker
                  value={form.gatePassDate}
                  onChange={(gatePassDate) => setForm({ ...form, gatePassDate })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={form.gatePassType}
                  onValueChange={(v) => setForm({ ...form, gatePassType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GATE_PASS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Direction</Label>
                <Select
                  value={form.direction}
                  onValueChange={(v) => setForm({ ...form, direction: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">IN</SelectItem>
                    <SelectItem value="OUT">OUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Returnable</Label>
                <Select
                  value={form.isReturnable ? "yes" : "no"}
                  onValueChange={(v) => setForm({ ...form, isReturnable: v === "yes" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.isReturnable && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Expected return date</Label>
                  <SecurityDatePicker
                    value={form.expectedReturnDate}
                    onChange={(expectedReturnDate) => setForm({ ...form, expectedReturnDate })}
                    placeholder="Expected return"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Vehicle no</Label>
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
              <div className="grid gap-2 sm:col-span-2">
                <Label>Purpose</Label>
                <Input
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                />
              </div>
            </div>
            <LineItemsEditor items={lineItems} onChange={setLineItems} showDescription />
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
              {GATE_PASS_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
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
                <TableHead>Pass no</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No gate passes found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((gp) => (
                  <TableRow key={gp.id}>
                    <TableCell>
                      <Link
                        href={`/security/gate-passes/${gp.id}`}
                        className="font-medium text-erp-accent hover:underline"
                      >
                        {gp.gatePassNo}
                      </Link>
                    </TableCell>
                    <TableCell>{gp.gatePassDate}</TableCell>
                    <TableCell>{gp.gatePassType}</TableCell>
                    <TableCell>{gp.direction}</TableCell>
                    <TableCell>
                      <SecurityStatusBadge status={gp.status} />
                    </TableCell>
                    <TableCell className="text-right">{gp.items?.length ?? 0}</TableCell>
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
