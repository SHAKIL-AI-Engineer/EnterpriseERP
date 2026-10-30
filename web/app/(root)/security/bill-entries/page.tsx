"use client";

import * as React from "react";
import Link from "next/link";
import { IconReceipt, IconLoader2, IconPlus } from "@tabler/icons-react";
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
  SecurityDatePicker,
  todayIsoDate,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { BillEntry } from "@/lib/types/security";
import { BILL_TYPES } from "@/lib/types/security";

export default function BillEntriesPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <BillEntriesContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function BillEntriesContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<BillEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    billNo: "",
    billDate: todayIsoDate(),
    billType: "Transport",
    amount: "",
    vatAmount: "",
    description: "",
  });

  const totalAmount =
    (parseFloat(form.amount) || 0) + (parseFloat(form.vatAmount) || 0);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await securityService.getBillEntries(
        companyId,
        fromDate || undefined,
        toDate || undefined,
      );
      setRows(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bill entries");
    } finally {
      setLoading(false);
    }
  }, [companyId, fromDate, toDate]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.billNo.trim()) {
      toast.error("Bill number is required");
      return;
    }
    setSubmitting(true);
    try {
      await securityService.createBillEntry({
        companyId,
        billNo: form.billNo.trim(),
        billDate: form.billDate,
        billType: form.billType,
        amount: parseFloat(form.amount) || 0,
        vatAmount: parseFloat(form.vatAmount) || 0,
        totalAmount,
        description: form.description.trim() || null,
      });
      toast.success("Bill entry created");
      setDialogOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create bill entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <IconReceipt className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bill Entries</h1>
            <p className="text-sm text-muted-foreground">Gate-related bills for accounts handoff.</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="size-4 mr-2" />
              New bill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create bill entry</DialogTitle>
              <DialogDescription>Total is calculated as amount + VAT.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Bill no</Label>
                <Input
                  value={form.billNo}
                  onChange={(e) => setForm({ ...form, billNo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <SecurityDatePicker
                  value={form.billDate}
                  onChange={(billDate) => setForm({ ...form, billDate })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={form.billType}
                  onValueChange={(v) => setForm({ ...form, billType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>VAT</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={form.vatAmount}
                    onChange={(e) => setForm({ ...form, vatAmount: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Total (auto)</Label>
                <Input readOnly value={totalAmount.toFixed(2)} className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
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
                <TableHead>Bill no</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No bill entries found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link
                        href={`/security/bill-entries/${b.id}`}
                        className="font-medium text-erp-accent hover:underline"
                      >
                        {b.billNo}
                      </Link>
                    </TableCell>
                    <TableCell>{b.billDate}</TableCell>
                    <TableCell>{b.billType}</TableCell>
                    <TableCell className="text-right font-mono">
                      {b.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <SecurityStatusBadge status={b.status} />
                    </TableCell>
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
