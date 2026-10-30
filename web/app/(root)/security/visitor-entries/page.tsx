"use client";

import * as React from "react";
import Link from "next/link";
import { IconPlus, IconEye, IconLogout, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  InOutTimeDisplay,
  SecurityStatusBadge,
  SecurityDatePicker,
  SecurityDateTimePicker,
  todayIsoDate,
  nowDateTimeLocal,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { Gate, Visitor, VisitorEntry } from "@/lib/types/security";

const VISITOR_STATUSES = ["", "CheckedIn", "CheckedOut", "Cancelled"] as const;

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function VisitorEntriesPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <VisitorEntriesContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function VisitorEntriesContent({ companyId }: { companyId: string }) {
  const [date, setDate] = React.useState(() => todayIsoDate());
  const [statusFilter, setStatusFilter] = React.useState("");
  const [entries, setEntries] = React.useState<VisitorEntry[]>([]);
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [visitors, setVisitors] = React.useState<Visitor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [checkoutEntry, setCheckoutEntry] = React.useState<VisitorEntry | null>(null);
  const [checkoutOutTime, setCheckoutOutTime] = React.useState(() => nowDateTimeLocal());
  const [checkingOut, setCheckingOut] = React.useState(false);

  const [form, setForm] = React.useState({
    gateId: "",
    visitorId: "",
    entryNo: "",
    visitDate: todayIsoDate(),
    inTime: nowDateTimeLocal(),
    purpose: "",
    visitorCardNo: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [entryRows, gateRows, visitorRows] = await Promise.all([
        securityService.getVisitorEntries(companyId, date),
        securityService.getGates(companyId),
        securityService.getVisitors(companyId),
      ]);
      setEntries(entryRows);
      setGates(gateRows.filter((g) => g.isActive));
      setVisitors(visitorRows.filter((v) => !v.isBlacklisted));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load visitor entries");
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  React.useEffect(() => {
    load();
  }, [load]);

  const gateMap = React.useMemo(
    () => new Map(gates.map((g) => [g.id, g])),
    [gates],
  );
  const visitorMap = React.useMemo(
    () => new Map(visitors.map((v) => [v.id, v])),
    [visitors],
  );

  const filtered = entries.filter((e) => !statusFilter || e.status === statusFilter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gateId || !form.visitorId || !form.entryNo || !form.purpose) {
      toast.error("Gate, visitor, entry no, and purpose are required");
      return;
    }
    setCreating(true);
    try {
      await securityService.createVisitorEntry({
        companyId,
        gateId: form.gateId,
        visitorId: form.visitorId,
        entryNo: form.entryNo,
        visitDate: form.visitDate,
        inTime: toIso(form.inTime),
        purpose: form.purpose,
        visitorCardNo: form.visitorCardNo || undefined,
      });
      toast.success("Visitor checked in");
      setCreateOpen(false);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to check in visitor");
    } finally {
      setCreating(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutEntry) return;
    setCheckingOut(true);
    try {
      await securityService.checkoutVisitorEntry(checkoutEntry.id, {
        outTime: toIso(checkoutOutTime),
      });
      toast.success("Visitor checked out");
      setCheckoutEntry(null);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to check out visitor");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCancel = async (entry: VisitorEntry) => {
    if (!window.confirm(`Cancel entry ${entry.entryNo}?`)) return;
    try {
      await securityService.cancelVisitorEntry(entry.id);
      toast.success("Entry cancelled");
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel entry");
    }
  };

  const openCheckout = (entry: VisitorEntry) => {
    setCheckoutOutTime(nowDateTimeLocal());
    setCheckoutEntry(entry);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visitor Check-In / Out</h2>
          <p className="text-muted-foreground">Register and track visitor gate entries</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <IconPlus className="h-4 w-4" />
              Check In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Visitor Check-In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Gate</Label>
                <NativeSelect
                  value={form.gateId}
                  onChange={(e) => setForm((f) => ({ ...f, gateId: e.target.value }))}
                  required
                >
                  <option value="">Select gate</option>
                  {gates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.gateName} ({g.gateCode})
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label>Visitor</Label>
                <NativeSelect
                  value={form.visitorId}
                  onChange={(e) => setForm((f) => ({ ...f, visitorId: e.target.value }))}
                  required
                >
                  <option value="">Select visitor</option>
                  {visitors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.visitorName}
                      {v.phone ? ` · ${v.phone}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Entry No</Label>
                  <Input
                    value={form.entryNo}
                    onChange={(e) => setForm((f) => ({ ...f, entryNo: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visit Date</Label>
                  <SecurityDatePicker
                    value={form.visitDate}
                    onChange={(visitDate) => setForm((f) => ({ ...f, visitDate }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>In Time</Label>
                <SecurityDateTimePicker
                  value={form.inTime}
                  onChange={(inTime) => setForm((f) => ({ ...f, inTime }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Visitor Card No</Label>
                <Input
                  value={form.visitorCardNo}
                  onChange={(e) => setForm((f) => ({ ...f, visitorCardNo: e.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Checking in…" : "Check In"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <SecurityDatePicker
              value={date}
              onChange={setDate}
              className="w-52"
              placeholder="Filter date"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-44"
            >
              <option value="">All statuses</option>
              {VISITOR_STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/60">
        <CardContent className="pt-6">
          <div className="rounded-md border border-muted-foreground/10 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Entry No</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>In / Out</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No visitor entries for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.entryNo}</TableCell>
                      <TableCell>
                        {visitorMap.get(entry.visitorId)?.visitorName ?? entry.visitorId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {gateMap.get(entry.gateId)?.gateName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <InOutTimeDisplay inTime={entry.inTime} outTime={entry.outTime} />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.purpose}</TableCell>
                      <TableCell>
                        <SecurityStatusBadge status={entry.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/security/visitor-entries/${entry.id}`}>
                              <IconEye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {entry.status === "CheckedIn" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Check out"
                                onClick={() => openCheckout(entry)}
                              >
                                <IconLogout className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Cancel"
                                onClick={() => handleCancel(entry)}
                              >
                                <IconX className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!checkoutEntry} onOpenChange={(open) => !open && setCheckoutEntry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Check Out Visitor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Entry {checkoutEntry?.entryNo}
            </p>
            <div className="space-y-2">
              <Label>Out Time</Label>
              <SecurityDateTimePicker
                value={checkoutOutTime}
                onChange={setCheckoutOutTime}
                placeholder="Out time"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? "Checking out…" : "Check Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
