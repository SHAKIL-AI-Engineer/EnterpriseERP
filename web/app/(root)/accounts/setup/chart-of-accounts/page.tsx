"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import {
  ACCOUNT_TYPES,
  NORMAL_BALANCES,
  type ChartOfAccountDto,
  type CreateChartOfAccountRequest,
  type UpdateChartOfAccountRequest,
} from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

const emptyForm = (): CreateChartOfAccountRequest => ({
  companyId: "",
  accountCode: "",
  accountName: "",
  parentAccountId: null,
  accountType: "Asset",
  normalBalance: "Debit",
  isControlAccount: false,
  isCashAccount: false,
  isBankAccount: false,
});

export default function ChartOfAccountsPage() {
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [rows, setRows] = useState<ChartOfAccountDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChartOfAccountDto | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      setRows(await accountsService.getChartOfAccounts(companyId));
    } catch {
      toast.error("Failed to load chart of accounts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), companyId: companyId ?? "" });
    setOpen(true);
  };

  const openEdit = (row: ChartOfAccountDto) => {
    setEditing(row);
    setForm({
      companyId: row.companyId,
      accountCode: row.accountCode,
      accountName: row.accountName,
      parentAccountId: row.parentAccountId,
      accountType: row.accountType,
      normalBalance: row.normalBalance,
      isControlAccount: row.isControlAccount,
      isCashAccount: row.isCashAccount,
      isBankAccount: row.isBankAccount,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      if (editing) {
        const body: UpdateChartOfAccountRequest = {
          accountName: form.accountName,
          parentAccountId: form.parentAccountId,
          accountType: form.accountType,
          normalBalance: form.normalBalance,
          isControlAccount: form.isControlAccount,
          isCashAccount: form.isCashAccount,
          isBankAccount: form.isBankAccount,
          isActive: editing.isActive,
          updatedBy: user?.id ?? null,
        };
        await accountsService.updateChartOfAccount(editing.id, body);
        toast.success("Account updated");
      } else {
        await accountsService.createChartOfAccount({
          ...form,
          companyId,
          createdBy: user?.id ?? null,
        });
        toast.success("Account created");
      }
      setOpen(false);
      load();
    } catch {
      toast.error(editing ? "Update failed" : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: ChartOfAccountDto) => {
    try {
      if (row.isActive) {
        await accountsService.deactivateChartOfAccount(row.id);
        toast.success("Account deactivated");
      } else {
        await accountsService.activateChartOfAccount(row.id);
        toast.success("Account activated");
      }
      load();
    } catch {
      toast.error("Status change failed");
    }
  };

  return (
    <AccountsListShell
      title="Chart of accounts"
      description="Manage GL accounts for the selected company."
      actions={
        <Button size="sm" onClick={openCreate}>
          New account
        </Button>
      }
    >
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Normal</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.accountCode}</TableCell>
                    <TableCell>{r.accountName}</TableCell>
                    <TableCell>{r.accountType}</TableCell>
                    <TableCell>{r.normalBalance}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[r.isCashAccount && "Cash", r.isBankAccount && "Bank", r.isControlAccount && "Control"]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell>{r.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive(r)}>
                        {r.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={save}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit account" : "New account"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {!editing && (
                <div className="space-y-1">
                  <Label>Account code</Label>
                  <Input
                    required
                    value={form.accountCode}
                    onChange={(e) => setForm({ ...form, accountCode: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label>Account name</Label>
                <Input
                  required
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Account type</Label>
                <NativeSelect
                  value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <NativeSelectOption key={t} value={t}>
                      {t}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1">
                <Label>Normal balance</Label>
                <NativeSelect
                  value={form.normalBalance}
                  onChange={(e) => setForm({ ...form, normalBalance: e.target.value })}
                >
                  {NORMAL_BALANCES.map((t) => (
                    <NativeSelectOption key={t} value={t}>
                      {t}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isCashAccount}
                  onChange={(e) => setForm({ ...form, isCashAccount: e.target.checked })}
                />
                Cash account
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isBankAccount}
                  onChange={(e) => setForm({ ...form, isBankAccount: e.target.checked })}
                />
                Bank account
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isControlAccount}
                  onChange={(e) => setForm({ ...form, isControlAccount: e.target.checked })}
                />
                Control account
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AccountsListShell>
  );
}

