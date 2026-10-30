"use client";

import * as React from "react";
import { IconFingerprint, IconLoader2, IconPlus } from "@tabler/icons-react";
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
  SecurityDateTimePicker,
  nowDateTimeLocal,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { Gate, SecurityCheckLog } from "@/lib/types/security";
import { SECURITY_REFERENCE_TYPES, CHECK_RESULTS } from "@/lib/types/security";

export default function SecurityChecksPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <SecurityChecksContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function SecurityChecksContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<SecurityCheckLog[]>([]);
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refTypeFilter, setRefTypeFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    gateId: "",
    referenceType: "GatePass",
    referenceId: "",
    checkTime: nowDateTimeLocal(),
    checkResult: "Passed",
    remarks: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [checks, gateList] = await Promise.all([
        securityService.getSecurityChecks(
          companyId,
          refTypeFilter === "all" ? undefined : refTypeFilter,
        ),
        securityService.getGates(companyId),
      ]);
      setRows(checks);
      setGates(gateList.filter((g) => g.isActive));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load security checks");
    } finally {
      setLoading(false);
    }
  }, [companyId, refTypeFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (gates.length && !form.gateId) {
      setForm((f) => ({ ...f, gateId: gates[0].id }));
    }
  }, [gates, form.gateId]);

  const handleCreate = async () => {
    if (!form.gateId || !form.referenceId.trim()) {
      toast.error("Gate and reference ID are required");
      return;
    }
    setSubmitting(true);
    try {
      await securityService.createSecurityCheck({
        companyId,
        gateId: form.gateId,
        referenceType: form.referenceType,
        referenceId: form.referenceId.trim(),
        checkTime: new Date(form.checkTime).toISOString(),
        checkResult: form.checkResult,
        remarks: form.remarks.trim() || null,
      });
      toast.success("Security check logged");
      setDialogOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create security check");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <IconFingerprint className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security Checks</h1>
            <p className="text-sm text-muted-foreground">Log gate verification against documents.</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="size-4 mr-2" />
              Log check
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New security check</DialogTitle>
              <DialogDescription>Record a check result at the gate.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
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
                <Label>Reference type</Label>
                <Select
                  value={form.referenceType}
                  onValueChange={(v) => setForm({ ...form, referenceType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURITY_REFERENCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Reference ID</Label>
                <Input
                  value={form.referenceId}
                  onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                  placeholder="Document GUID"
                />
              </div>
              <div className="grid gap-2">
                <Label>Check time</Label>
                <SecurityDateTimePicker
                  value={form.checkTime}
                  onChange={(checkTime) => setForm({ ...form, checkTime })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Result</Label>
                <Select
                  value={form.checkResult}
                  onValueChange={(v) => setForm({ ...form, checkResult: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECK_RESULTS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Remarks</Label>
                <Input
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="grid gap-1">
          <Label className="text-xs">Reference type</Label>
          <Select value={refTypeFilter} onValueChange={setRefTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {SECURITY_REFERENCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
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
                <TableHead>Time</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No checks logged
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">
                      {new Date(c.checkTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{c.referenceType}</span>
                      <br />
                      <span className="font-mono text-xs">{c.referenceId.slice(0, 8)}…</span>
                    </TableCell>
                    <TableCell>
                      <SecurityStatusBadge status={c.checkResult} />
                    </TableCell>
                    <TableCell>{c.remarks || "—"}</TableCell>
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
