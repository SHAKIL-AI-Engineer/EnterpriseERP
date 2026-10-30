"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FiscalYearDto } from "@/lib/services/accounts-types";
import { todayIso } from "@/lib/accounts-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

export default function FiscalYearsPage() {
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [rows, setRows] = useState<FiscalYearDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      setRows(await accountsService.getFiscalYears(companyId));
    } catch {
      toast.error("Failed to load fiscal years");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      await accountsService.createFiscalYear({
        companyId,
        yearName,
        startDate,
        endDate,
        createdBy: user?.id ?? null,
      });
      toast.success("Fiscal year created");
      setYearName("");
      load();
    } catch {
      toast.error("Create failed");
    } finally {
      setSaving(false);
    }
  };

  const closeYear = async (id: string) => {
    try {
      await accountsService.closeFiscalYear(id, user?.id);
      toast.success("Fiscal year closed");
      load();
    } catch {
      toast.error("Close failed");
    }
  };

  return (
    <AccountsListShell title="Fiscal years" description="Define and close fiscal periods.">
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Create fiscal year</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label>Year name</Label>
              <Input required value={yearName} onChange={(e) => setYearName(e.target.value)} placeholder="FY 2026" />
            </div>
            <div className="space-y-1">
              <Label>Start date</Label>
              <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End date</Label>
              <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.yearName}</TableCell>
                    <TableCell>{r.startDate}</TableCell>
                    <TableCell>{r.endDate}</TableCell>
                    <TableCell>{r.isClosed ? "Closed" : "Open"}</TableCell>
                    <TableCell className="text-right">
                      {!r.isClosed && (
                        <Button variant="outline" size="sm" onClick={() => closeYear(r.id)}>Close</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AccountsListShell>
  );
}
