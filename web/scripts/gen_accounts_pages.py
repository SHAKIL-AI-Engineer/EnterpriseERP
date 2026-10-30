#!/usr/bin/env python3
"""Generate Next.js accounts module pages. Uses 'motion' placeholder → <div> after write."""
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "app/(root)/accounts"
D, CD = "motion", "motion"

SKIP = {
    "dashboard/page.tsx",
    "setup/chart-of-accounts/page.tsx",
    "setup/fiscal-years/page.tsx",
    "vouchers/page.tsx",
}

CREATED: list[str] = []


def fix(s: str) -> str:
    return s.replace(f"<{D} ", "<div ").replace(f"</{CD}>", "</div>")


def w(rel: str, content: str) -> None:
    if rel in SKIP:
        print(f"skip {rel}")
        return
    p = BASE / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(fix(content.strip()) + "\n")
    CREATED.append(rel)
    print(rel)


# ── 1-2: Vouchers new + detail ──────────────────────────────────────────────

w(
    "vouchers/new/page.tsx",
    '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { AccountPicker } from "@/components/accounts/account-picker";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { VOUCHER_TYPES } from "@/lib/services/accounts-types";
import type { CreateVoucherLineRequest } from "@/lib/services/accounts-types";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { IconPlus, IconTrash } from "@tabler/icons-react";

type Line = CreateVoucherLineRequest & { key: string };

function emptyLine(): Line {
  return { key: Math.random().toString(36).slice(2), accountId: "", debitAmount: 0, creditAmount: 0, description: "" };
}

export default function NewVoucherPage() {
  const router = useRouter();
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [voucherNo, setVoucherNo] = useState(() => docNo("VCH"));
  const [voucherDate, setVoucherDate] = useState(todayIso());
  const [voucherType, setVoucherType] = useState<string>(VOUCHER_TYPES[0]);
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debitAmount) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.creditAmount) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    if (!balanced) { toast.error("Total debit must equal total credit"); return; }
    if (lines.some((l) => !l.accountId)) { toast.error("Select an account for every line"); return; }
    setSaving(true);
    try {
      const created = await accountsService.createVoucher({
        companyId, voucherNo, voucherDate, voucherType,
        referenceNo: referenceNo || null, narration: narration || null,
        createdBy: user?.id ?? null,
        lines: lines.map(({ accountId, debitAmount, creditAmount, description }) => ({
          accountId, debitAmount: Number(debitAmount) || 0, creditAmount: Number(creditAmount) || 0,
          description: description || null,
        })),
      });
      toast.success("Voucher created");
      router.push(`/accounts/vouchers/${created.id}`);
    } catch { toast.error("Failed to create voucher"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New voucher" description="Create a multi-line journal voucher."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/vouchers">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company to continue.</p> : (
        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Header</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <motion className="space-y-1"><Label>Voucher no</Label>
                <Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Date</Label>
                <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Type</Label>
                <NativeSelect value={voucherType} onChange={(e) => setVoucherType(e.target.value)}>
                  {VOUCHER_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></motion>
              <motion className="space-y-1"><Label>Reference</Label>
                <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} /></motion>
              <motion className="space-y-1 sm:col-span-2"><Label>Narration</Label>
                <Input value={narration} onChange={(e) => setNarration(e.target.value)} /></motion>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Lines</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
                <IconPlus className="h-4 w-4 mr-1" /> Add line
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Account</TableHead><TableHead className="w-28">Debit</TableHead>
                  <TableHead className="w-28">Credit</TableHead><TableHead>Description</TableHead><TableHead className="w-10" />
                </TableRow></TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.key}>
                      <TableCell>
                        <AccountPicker companyId={companyId} value={line.accountId} required
                          onChange={(id) => updateLine(line.key, { accountId: id })} label="" />
                      </TableCell>
                      <TableCell><Input type="number" min={0} step="0.01" value={line.debitAmount || ""}
                        onChange={(e) => updateLine(line.key, { debitAmount: Number(e.target.value), creditAmount: 0 })} /></TableCell>
                      <TableCell><Input type="number" min={0} step="0.01" value={line.creditAmount || ""}
                        onChange={(e) => updateLine(line.key, { creditAmount: Number(e.target.value), debitAmount: 0 })} /></TableCell>
                      <TableCell><Input value={line.description ?? ""} onChange={(e) => updateLine(line.key, { description: e.target.value })} /></TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" disabled={lines.length <= 2}
                          onClick={() => setLines((p) => p.filter((l) => l.key !== line.key))}>
                          <IconTrash className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium bg-muted/30">
                    <TableCell>Totals</TableCell>
                    <TableCell>{formatCurrency(totalDebit)}</TableCell>
                    <TableCell>{formatCurrency(totalCredit)}</TableCell>
                    <TableCell colSpan={2} className={balanced ? "text-emerald-600" : "text-destructive"}>
                      {balanced ? "Balanced" : "Out of balance"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Button type="submit" disabled={saving || !balanced}>{saving ? "Saving…" : "Create voucher"}</Button>
        </form>
      )}
    </motion>
  );
}
''',
)

w(
    "vouchers/[id]/page.tsx",
    '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { VoucherDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function VoucherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<VoucherDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getVoucher(id)); }
    catch { toast.error("Failed to load voucher"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<VoucherDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Voucher not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.voucherNo} description={`${row.voucherType} · ${row.voucherDate}`}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/vouchers">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Summary</CardTitle>
          <WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Reference:</span> {row.referenceNo ?? "—"}</p>
          <p><span className="text-muted-foreground">Narration:</span> {row.narration ?? "—"}</p>
          <p><span className="text-muted-foreground">Total debit:</span> {formatCurrency(row.totalDebit)}</p>
          <p><span className="text-muted-foreground">Total credit:</span> {formatCurrency(row.totalCredit)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Lines</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead><TableHead>Description</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {row.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-sm">{l.accountId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.debitAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.creditAmount)}</TableCell>
                  <TableCell>{l.description ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {companyId && (
        <motion className="flex flex-wrap gap-2">
          {row.status === "Draft" && (
            <Button disabled={acting} onClick={() => act(() => accountsService.submitVoucher(id, userId), "Submitted")}>Submit</Button>
          )}
          {row.status === "Submitted" && (
            <Button disabled={acting} onClick={() => act(() => accountsService.approveVoucher(id, userId), "Approved")}>Approve</Button>
          )}
          {row.status === "Approved" && (
            <Button disabled={acting} onClick={() => act(() => accountsService.postVoucher(id, userId), "Posted")}>Post</Button>
          )}
          {!["Posted", "Cancelled"].includes(row.status) && (
            <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.cancelVoucher(id, userId), "Cancelled")}>Cancel</Button>
          )}
        </motion>
      )}
    </motion>
  );
}
''',
)

# ── 3-5: Cash receipts ──────────────────────────────────────────────────────

w(
    "receipts/cash/page.tsx",
    '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { CashReceiptDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function CashReceiptsPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [rows, setRows] = useState<CashReceiptDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getCashReceipts({ companyId, ...range })); }
    catch { toast.error("Failed to load cash receipts"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Cash receipts" description="Cash and bank receipt vouchers."
      actions={<Button size="sm" asChild><Link href="/accounts/receipts/cash/new">New receipt</Link></Button>}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>From</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/receipts/cash/${r.id}`}>{r.receiptNo}</Link></TableCell>
                  <TableCell>{r.receiptDate}</TableCell>
                  <TableCell>{r.receivedFromType}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/receipts/cash/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
''',
)

w(
    "receipts/cash/new/page.tsx",
    '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { AccountPicker } from "@/components/accounts/account-picker";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { PAYMENT_METHODS, RECEIVED_FROM_TYPES } from "@/lib/services/accounts-types";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toast } from "sonner";

export default function NewCashReceiptPage() {
  const router = useRouter();
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [receiptNo, setReceiptNo] = useState(() => docNo("CR"));
  const [receiptDate, setReceiptDate] = useState(todayIso());
  const [receivedFromType, setReceivedFromType] = useState(RECEIVED_FROM_TYPES[0]);
  const [receivedFromId, setReceivedFromId] = useState("");
  const [cashOrBankAccountId, setCashOrBankAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [referenceNo, setReferenceNo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !cashOrBankAccountId) return;
    setSaving(true);
    try {
      const created = await accountsService.createCashReceipt({
        companyId, receiptNo, receiptDate, receivedFromType,
        receivedFromId: receivedFromId || null, cashOrBankAccountId,
        amount: Number(amount), paymentMethod,
        referenceNo: referenceNo || null, purpose: purpose || null,
        createdBy: user?.id ?? null,
      });
      toast.success("Cash receipt created");
      router.push(`/accounts/receipts/cash/${created.id}`);
    } catch { toast.error("Failed to create receipt"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New cash receipt" description="Record cash or bank receipt."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/receipts/cash">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Receipt details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <motion className="space-y-1"><Label>Receipt no</Label><Input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Date</Label><Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Received from type</Label>
                <NativeSelect value={receivedFromType} onChange={(e) => setReceivedFromType(e.target.value as typeof receivedFromType)}>
                  {RECEIVED_FROM_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></motion>
              <motion className="space-y-1"><Label>Received from ID</Label><Input value={receivedFromId} onChange={(e) => setReceivedFromId(e.target.value)} /></motion>
              <AccountPicker companyId={companyId} value={cashOrBankAccountId} onChange={setCashOrBankAccountId} label="Cash/bank account" required />
              <motion className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Payment method</Label>
                <NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
                  {PAYMENT_METHODS.map((m) => <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}
                </NativeSelect></motion>
              <motion className="space-y-1"><Label>Reference</Label><Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} /></motion>
              <motion className="space-y-1 sm:col-span-2"><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></motion>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create receipt"}</Button>
        </form>
      )}
    </motion>
  );
}
''',
)

w(
    "receipts/cash/[id]/page.tsx",
    '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { CashReceiptDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CashReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<CashReceiptDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getCashReceipt(id)); }
    catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<CashReceiptDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.receiptNo} description={row.receiptDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/receipts/cash">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">From:</span> {row.receivedFromType}</p>
          <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(row.amount)}</p>
          <p><span className="text-muted-foreground">Method:</span> {row.paymentMethod}</p>
          <p><span className="text-muted-foreground">Purpose:</span> {row.purpose ?? "—"}</p>
        </CardContent>
      </Card>
      {companyId && (
        <motion className="flex flex-wrap gap-2">
          {row.status === "Pending" && <Button disabled={acting} onClick={() => act(() => accountsService.approveCashReceipt(id, userId), "Approved")}>Approve</Button>}
          {row.status === "Approved" && <Button disabled={acting} onClick={() => act(() => accountsService.postCashReceipt(id, userId), "Posted")}>Post</Button>}
          {!["Posted", "Cancelled"].includes(row.status) && (
            <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.cancelCashReceipt(id, userId), "Cancelled")}>Cancel</Button>
          )}
        </motion>
      )}
    </motion>
  );
}
''',
)

# ── 6-8: Money receipts ─────────────────────────────────────────────────────

w(
    "receipts/money/page.tsx",
    '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { MoneyReceiptDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function MoneyReceiptsPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [rows, setRows] = useState<MoneyReceiptDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getMoneyReceipts({ companyId, ...range })); }
    catch { toast.error("Failed to load"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Money receipts" description="Formal money receipt records."
      actions={<Button size="sm" asChild><Link href="/accounts/receipts/money/new">New receipt</Link></Button>}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>Received from</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/receipts/money/${r.id}`}>{r.moneyReceiptNo}</Link></TableCell>
                  <TableCell>{r.receiptDate}</TableCell>
                  <TableCell>{r.receivedFrom}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/receipts/money/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
''',
)

w(
    "receipts/money/new/page.tsx",
    '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { AccountPicker } from "@/components/accounts/account-picker";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { PAYMENT_METHODS, RECEIVED_FROM_TYPES } from "@/lib/services/accounts-types";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toast } from "sonner";

export default function NewMoneyReceiptPage() {
  const router = useRouter();
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [moneyReceiptNo, setMoneyReceiptNo] = useState(() => docNo("MR"));
  const [receiptDate, setReceiptDate] = useState(todayIso());
  const [receivedFrom, setReceivedFrom] = useState("");
  const [receivedFromType, setReceivedFromType] = useState(RECEIVED_FROM_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [cashOrBankAccountId, setCashOrBankAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !cashOrBankAccountId || !receivedFrom) return;
    setSaving(true);
    try {
      const created = await accountsService.createMoneyReceipt({
        companyId, moneyReceiptNo, receiptDate, receivedFrom, receivedFromType,
        amount: Number(amount), paymentMethod, cashOrBankAccountId,
        description: description || null, createdBy: user?.id ?? null,
      });
      toast.success("Money receipt created");
      router.push(`/accounts/receipts/money/${created.id}`);
    } catch { toast.error("Failed to create"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New money receipt" description="Create a money receipt."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/receipts/money">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <motion className="space-y-1"><Label>Receipt no</Label><Input value={moneyReceiptNo} onChange={(e) => setMoneyReceiptNo(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Date</Label><Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Received from</Label><Input value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>From type</Label>
                <NativeSelect value={receivedFromType} onChange={(e) => setReceivedFromType(e.target.value as typeof receivedFromType)}>
                  {RECEIVED_FROM_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></motion>
              <motion className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Payment method</Label>
                <NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
                  {PAYMENT_METHODS.map((m) => <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}
                </NativeSelect></motion>
              <AccountPicker companyId={companyId} value={cashOrBankAccountId} onChange={setCashOrBankAccountId} label="Cash/bank account" required />
              <motion className="space-y-1 sm:col-span-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></motion>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create receipt"}</Button>
        </form>
      )}
    </motion>
  );
}
''',
)

w(
    "receipts/money/[id]/page.tsx",
    '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { MoneyReceiptDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function MoneyReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<MoneyReceiptDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getMoneyReceipt(id)); }
    catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<MoneyReceiptDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.moneyReceiptNo} description={row.receiptDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/receipts/money">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Received from:</span> {row.receivedFrom}</p>
          <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(row.amount)}</p>
          <p><span className="text-muted-foreground">Method:</span> {row.paymentMethod}</p>
          <p><span className="text-muted-foreground">Description:</span> {row.description ?? "—"}</p>
        </CardContent>
      </Card>
      {companyId && (
        <motion className="flex flex-wrap gap-2">
          {row.status === "Pending" && <Button disabled={acting} onClick={() => act(() => accountsService.approveMoneyReceipt(id, userId), "Approved")}>Approve</Button>}
          {row.status === "Approved" && <Button disabled={acting} onClick={() => act(() => accountsService.postMoneyReceipt(id, userId), "Posted")}>Post</Button>}
        </motion>
      )}
    </motion>
  );
}
''',
)

# ── 9-11: Daily expenses ────────────────────────────────────────────────────

w("expenses/daily/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { DailyExpenseDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function DailyExpensesPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [rows, setRows] = useState<DailyExpenseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getDailyExpenses({ companyId, ...range })); }
    catch { toast.error("Failed to load expenses"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Daily expenses" description="Day-to-day expense entries."
      actions={<Button size="sm" asChild><Link href="/accounts/expenses/daily/new">New expense</Link></Button>}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/expenses/daily/${r.id}`}>{r.expenseNo}</Link></TableCell>
                  <TableCell>{r.expenseDate}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/expenses/daily/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("expenses/daily/new/page.tsx", '''
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { AccountPicker } from "@/components/accounts/account-picker";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { PAYMENT_METHODS } from "@/lib/services/accounts-types";
import type { ExpenseCategoryDto } from "@/lib/services/accounts-types";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toast } from "sonner";

export default function NewDailyExpensePage() {
  const router = useRouter();
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [expenseNo, setExpenseNo] = useState(() => docNo("EXP"));
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [paidFromAccountId, setPaidFromAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paidTo, setPaidTo] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) { setCategories([]); return; }
    accountsService.getExpenseCategories(companyId).then(setCategories).catch(() => setCategories([]));
  }, [companyId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !expenseCategoryId || !paidFromAccountId) return;
    setSaving(true);
    try {
      const created = await accountsService.createDailyExpense({
        companyId, expenseNo, expenseDate, expenseCategoryId, paidFromAccountId,
        amount: Number(amount), paymentMethod, paidTo: paidTo || null,
        description: description || null, requestedBy: user?.id ?? null,
      });
      toast.success("Expense created");
      router.push(`/accounts/expenses/daily/${created.id}`);
    } catch { toast.error("Failed to create expense"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New daily expense" description="Record a daily expense."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/expenses/daily">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Expense details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <motion className="space-y-1"><Label>Expense no</Label><Input value={expenseNo} onChange={(e) => setExpenseNo(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Date</Label><Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Category</Label>
                <NativeSelect value={expenseCategoryId} required onChange={(e) => setExpenseCategoryId(e.target.value)}>
                  <NativeSelectOption value="" disabled>Select category…</NativeSelectOption>
                  {categories.map((c) => <NativeSelectOption key={c.id} value={c.id}>{c.categoryCode} — {c.categoryName}</NativeSelectOption>)}
                </NativeSelect></motion>
              <AccountPicker companyId={companyId} value={paidFromAccountId} onChange={setPaidFromAccountId} label="Paid from account" required />
              <motion className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Payment method</Label>
                <NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
                  {PAYMENT_METHODS.map((m) => <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}
                </NativeSelect></motion>
              <motion className="space-y-1"><Label>Paid to</Label><Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} /></motion>
              <motion className="space-y-1 sm:col-span-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></motion>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create expense"}</Button>
        </form>
      )}
    </motion>
  );
}
''')

w("expenses/daily/[id]/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { DailyExpenseDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function DailyExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<DailyExpenseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getDailyExpense(id)); }
    catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<DailyExpenseDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.expenseNo} description={row.expenseDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/expenses/daily">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(row.amount)}</p>
          <p><span className="text-muted-foreground">Method:</span> {row.paymentMethod}</p>
          <p><span className="text-muted-foreground">Paid to:</span> {row.paidTo ?? "—"}</p>
          <p><span className="text-muted-foreground">Description:</span> {row.description ?? "—"}</p>
        </CardContent>
      </Card>
      {companyId && (
        <motion className="flex flex-wrap gap-2">
          {row.status === "Pending" && <Button disabled={acting} onClick={() => act(() => accountsService.approveDailyExpense(id, userId), "Approved")}>Approve</Button>}
          {row.status === "Approved" && <Button disabled={acting} onClick={() => act(() => accountsService.payDailyExpense(id, userId), "Paid")}>Pay</Button>}
          {!["Paid", "Rejected"].includes(row.status) && (
            <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.rejectDailyExpense(id, userId), "Rejected")}>Reject</Button>
          )}
        </motion>
      )}
    </motion>
  );
}
''')

# ── 12-14: Money requests ───────────────────────────────────────────────────

w("requests/money/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { MoneyRequestDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function MoneyRequestsPage() {
  const { companyId } = useAccountsCompany();
  const [rows, setRows] = useState<MoneyRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getMoneyRequests({ companyId })); }
    catch { toast.error("Failed to load requests"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Money requests" description="Internal fund requisition workflow."
      actions={<Button size="sm" asChild><Link href="/accounts/requests/money/new">New request</Link></Button>}>
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>Purpose</TableHead>
              <TableHead className="text-right">Requested</TableHead><TableHead className="text-right">Approved</TableHead>
              <TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/requests/money/${r.id}`}>{r.requestNo}</Link></TableCell>
                  <TableCell>{r.requestDate}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.purpose}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.requestedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.approvedAmount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/requests/money/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("requests/money/new/page.tsx", '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function NewMoneyRequestPage() {
  const router = useRouter();
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [requestNo, setRequestNo] = useState(() => docNo("MRQ"));
  const [requestDate, setRequestDate] = useState(todayIso());
  const [purpose, setPurpose] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !user?.id) return;
    setSaving(true);
    try {
      const created = await accountsService.createMoneyRequest({
        companyId, requestNo, requestDate, requestedBy: user.id,
        departmentId: departmentId || null, purpose,
        requestedAmount: Number(requestedAmount),
      });
      toast.success("Request created");
      router.push(`/accounts/requests/money/${created.id}`);
    } catch { toast.error("Failed to create request"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New money request" description="Submit a fund requisition."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/requests/money">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Request details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <motion className="space-y-1"><Label>Request no</Label><Input value={requestNo} onChange={(e) => setRequestNo(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Date</Label><Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} required /></motion>
              <motion className="space-y-1 sm:col-span-2"><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Requested amount</Label><Input type="number" min={0} step="0.01" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Department ID</Label><Input value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} /></motion>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Submit request"}</Button>
        </form>
      )}
    </motion>
  );
}
''')

w("requests/money/[id]/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { MoneyRequestDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MoneyRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<MoneyRequestDto | null>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await accountsService.getMoneyRequest(id);
      setRow(data);
      setApprovedAmount(String(data.requestedAmount));
    } catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<MoneyRequestDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.requestNo} description={row.requestDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/requests/money">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Purpose:</span> {row.purpose}</p>
          <p><span className="text-muted-foreground">Requested:</span> {formatCurrency(row.requestedAmount)}</p>
          <p><span className="text-muted-foreground">Approved:</span> {formatCurrency(row.approvedAmount)}</p>
          <p><span className="text-muted-foreground">Paid:</span> {formatCurrency(row.paidAmount)}</p>
        </CardContent>
      </Card>
      {companyId && row.status === "Pending" && (
        <Card><CardContent className="pt-6 flex flex-wrap items-end gap-3">
          <motion className="space-y-1"><Label>Approved amount</Label>
            <Input type="number" min={0} step="0.01" className="w-40" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} /></motion>
          <Button disabled={acting || !user?.id} onClick={() => act(() => accountsService.approveMoneyRequest(id, { approvedBy: user!.id, approvedAmount: Number(approvedAmount) }), "Approved")}>Approve</Button>
          <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.rejectMoneyRequest(id, user?.id), "Rejected")}>Reject</Button>
        </CardContent></Card>
      )}
      {companyId && row.status === "Approved" && (
        <Button disabled={acting} onClick={() => act(() => accountsService.payMoneyRequest(id, user?.id), "Paid")}>Pay</Button>
      )}
    </motion>
  );
}
''')

# ── 15-17: Advance payments ─────────────────────────────────────────────────

w("advances/payments/page.tsx", '''
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { AdvancePaymentDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function AdvancePaymentsPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState<AdvancePaymentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getAdvancePayments({ companyId, ...range })); }
    catch { toast.error("Failed to load"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => tab === "contractual" ? rows.filter((r) => r.advanceType === "ProjectAdvance") : rows, [rows, tab]);

  const table = (
    <Table>
      <TableHeader><TableRow>
        <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead>
        <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
      </TableRow></TableHeader>
      <TableBody>
        {filtered.map((r) => (
          <TableRow key={r.id}>
            <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/advances/payments/${r.id}`}>{r.advanceNo}</Link></TableCell>
            <TableCell>{r.advanceDate}</TableCell>
            <TableCell>{r.advanceType}</TableCell>
            <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
            <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
            <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/advances/payments/${r.id}`}>Open</Link></Button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <AccountsListShell title="Advance payments" description="Employee, supplier, and project advances."
      actions={<Button size="sm" asChild><Link href="/accounts/advances/payments/new">New advance</Link></Button>}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="contractual">Contractual</TabsTrigger></TabsList>
        <TabsContent value="all">
          <Card><CardContent className="pt-6">{loading ? <p className="text-sm text-muted-foreground">Loading…</p> : table}</CardContent></Card>
        </TabsContent>
        <TabsContent value="contractual">
          <Card><CardContent className="pt-6">{loading ? <p className="text-sm text-muted-foreground">Loading…</p> : table}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </AccountsListShell>
  );
}
''')

w("advances/payments/new/page.tsx", '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { AccountPicker } from "@/components/accounts/account-picker";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { ADVANCE_TYPES, PAID_TO_TYPES } from "@/lib/services/accounts-types";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toast } from "sonner";

export default function NewAdvancePaymentPage() {
  const router = useRouter();
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [advanceNo, setAdvanceNo] = useState(() => docNo("ADV"));
  const [advanceDate, setAdvanceDate] = useState(todayIso());
  const [advanceType, setAdvanceType] = useState(ADVANCE_TYPES[0]);
  const [paidToType, setPaidToType] = useState(PAID_TO_TYPES[0]);
  const [paidToName, setPaidToName] = useState("");
  const [paidFromAccountId, setPaidFromAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !paidFromAccountId) return;
    setSaving(true);
    try {
      const created = await accountsService.createAdvancePayment({
        companyId, advanceNo, advanceDate, advanceType, paidToType,
        paidToName: paidToName || null, paidFromAccountId,
        amount: Number(amount), purpose: purpose || null, createdBy: user?.id ?? null,
      });
      toast.success("Advance created");
      router.push(`/accounts/advances/payments/${created.id}`);
    } catch { toast.error("Failed to create"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New advance payment" description="Issue an advance to employee or supplier."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/advances/payments">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Advance details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <motion className="space-y-1"><Label>Advance no</Label><Input value={advanceNo} onChange={(e) => setAdvanceNo(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Date</Label><Input type="date" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Advance type</Label>
                <NativeSelect value={advanceType} onChange={(e) => setAdvanceType(e.target.value as typeof advanceType)}>
                  {ADVANCE_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></motion>
              <motion className="space-y-1"><Label>Paid to type</Label>
                <NativeSelect value={paidToType} onChange={(e) => setPaidToType(e.target.value as typeof paidToType)}>
                  {PAID_TO_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></motion>
              <motion className="space-y-1"><Label>Paid to name</Label><Input value={paidToName} onChange={(e) => setPaidToName(e.target.value)} /></motion>
              <AccountPicker companyId={companyId} value={paidFromAccountId} onChange={setPaidFromAccountId} label="Paid from account" required />
              <motion className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></motion>
              <motion className="space-y-1 sm:col-span-2"><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></motion>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create advance"}</Button>
        </form>
      )}
    </motion>
  );
}
''')

w("advances/payments/[id]/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { AdvancePaymentDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdvancePaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<AdvancePaymentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getAdvancePayment(id)); }
    catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<AdvancePaymentDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.advanceNo} description={`${row.advanceType} · ${row.advanceDate}`}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/advances/payments">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Paid to:</span> {row.paidToName ?? row.paidToType}</p>
          <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(row.amount)}</p>
          <p><span className="text-muted-foreground">Purpose:</span> {row.purpose ?? "—"}</p>
        </CardContent>
      </Card>
      {companyId && (
        <motion className="flex flex-wrap gap-2">
          {row.status === "Pending" && <Button disabled={acting} onClick={() => act(() => accountsService.approveAdvancePayment(id, userId), "Approved")}>Approve</Button>}
          {row.status === "Approved" && <Button disabled={acting} onClick={() => act(() => accountsService.payAdvancePayment(id, userId), "Paid")}>Pay</Button>}
        </motion>
      )}
    </motion>
  );
}
''')

# ── 18-20: Advance salary ───────────────────────────────────────────────────

w("advances/salary/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { AdvanceSalaryPaymentDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function AdvanceSalaryPage() {
  const { companyId } = useAccountsCompany();
  const [rows, setRows] = useState<AdvanceSalaryPaymentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getAdvanceSalaryPayments({ companyId })); }
    catch { toast.error("Failed to load"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Advance salary" description="Salary advance payments with installment recovery."
      actions={<Button size="sm" asChild><Link href="/accounts/advances/salary/new">New advance</Link></Button>}>
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>Employee</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/advances/salary/${r.id}`}>{r.advanceSalaryNo}</Link></TableCell>
                  <TableCell>{r.advanceDate}</TableCell>
                  <TableCell className="font-mono text-sm">{r.employeeId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/advances/salary/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("advances/salary/new/page.tsx", '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { AccountPicker } from "@/components/accounts/account-picker";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function NewAdvanceSalaryPage() {
  const router = useRouter();
  const { companyId } = useAccountsCompany();
  const { user } = useAuth();
  const now = new Date();
  const [advanceSalaryNo, setAdvanceSalaryNo] = useState(() => docNo("ASAL"));
  const [advanceDate, setAdvanceDate] = useState(todayIso());
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [deductionStartYear, setDeductionStartYear] = useState(now.getFullYear());
  const [deductionStartMonth, setDeductionStartMonth] = useState(now.getMonth() + 1);
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [paidFromAccountId, setPaidFromAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !employeeId || !paidFromAccountId) return;
    setSaving(true);
    try {
      const created = await accountsService.createAdvanceSalaryPayment({
        companyId, employeeId, advanceSalaryNo, advanceDate,
        amount: Number(amount), deductionStartYear, deductionStartMonth,
        installmentAmount: Number(installmentAmount), paidFromAccountId,
        createdBy: user?.id ?? null,
      });
      toast.success("Advance salary created");
      router.push(`/accounts/advances/salary/${created.id}`);
    } catch { toast.error("Failed to create"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New advance salary" description="Issue salary advance with deduction schedule."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/advances/salary">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Advance details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <motion className="space-y-1"><Label>Advance no</Label><Input value={advanceSalaryNo} onChange={(e) => setAdvanceSalaryNo(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Date</Label><Input type="date" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Employee ID</Label><Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></motion>
              <motion className="space-y-1"><Label>Deduction start year</Label><Input type="number" value={deductionStartYear} onChange={(e) => setDeductionStartYear(Number(e.target.value))} required /></motion>
              <motion className="space-y-1"><Label>Deduction start month</Label><Input type="number" min={1} max={12} value={deductionStartMonth} onChange={(e) => setDeductionStartMonth(Number(e.target.value))} required /></motion>
              <motion className="space-y-1"><Label>Installment amount</Label><Input type="number" min={0} step="0.01" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} required /></motion>
              <AccountPicker companyId={companyId} value={paidFromAccountId} onChange={setPaidFromAccountId} label="Paid from account" required />
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create advance"}</Button>
        </form>
      )}
    </motion>
  );
}
''')

w("advances/salary/[id]/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { AdvanceSalaryPaymentDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdvanceSalaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<AdvanceSalaryPaymentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getAdvanceSalaryPayment(id)); }
    catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<AdvanceSalaryPaymentDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.advanceSalaryNo} description={row.advanceDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/advances/salary">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(row.amount)}</p>
          <p><span className="text-muted-foreground">Installment:</span> {formatCurrency(row.installmentAmount)}</p>
          <p><span className="text-muted-foreground">Deduction from:</span> {row.deductionStartMonth}/{row.deductionStartYear}</p>
        </CardContent>
      </Card>
      {companyId && (
        <motion className="flex flex-wrap gap-2">
          {row.status === "Pending" && <Button disabled={acting} onClick={() => act(() => accountsService.approveAdvanceSalaryPayment(id, userId), "Approved")}>Approve</Button>}
          {row.status === "Approved" && <Button disabled={acting} onClick={() => act(() => accountsService.payAdvanceSalaryPayment(id, userId), "Paid")}>Pay</Button>}
        </motion>
      )}
    </motion>
  );
}
''')

# ── 21-23: Company transfers ────────────────────────────────────────────────

w("transfers/company/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { CompanyMoneyTransferDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function CompanyTransfersPage() {
  const { companyId } = useAccountsCompany();
  const [rows, setRows] = useState<CompanyMoneyTransferDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getCompanyMoneyTransfers({ fromCompanyId: companyId })); }
    catch { toast.error("Failed to load transfers"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Company transfers" description="Inter-company fund transfers."
      actions={<Button size="sm" asChild><Link href="/accounts/transfers/company/new">New transfer</Link></Button>}>
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>To company</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/transfers/company/${r.id}`}>{r.transferNo}</Link></TableCell>
                  <TableCell>{r.transferDate}</TableCell>
                  <TableCell className="font-mono text-sm">{r.toCompanyId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/transfers/company/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("transfers/company/new/page.tsx", '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { AccountPicker } from "@/components/accounts/account-picker";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import { PAYMENT_METHODS } from "@/lib/services/accounts-types";
import { docNo, todayIso } from "@/lib/accounts-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toast } from "sonner";

export default function NewCompanyTransferPage() {
  const router = useRouter();
  const { companies, companyId } = useAccountsCompany();
  const { user } = useAuth();
  const [transferNo, setTransferNo] = useState(() => docNo("XFR"));
  const [fromCompanyId, setFromCompanyId] = useState(companyId ?? "");
  const [toCompanyId, setToCompanyId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferDate, setTransferDate] = useState(todayIso());
  const [amount, setAmount] = useState("");
  const [transferMethod, setTransferMethod] = useState(PAYMENT_METHODS[0]);
  const [referenceNo, setReferenceNo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCompanyId || !toCompanyId || !fromAccountId || !toAccountId) return;
    if (fromCompanyId === toCompanyId) { toast.error("From and to company must differ"); return; }
    setSaving(true);
    try {
      const created = await accountsService.createCompanyMoneyTransfer({
        transferNo, fromCompanyId, toCompanyId, fromAccountId, toAccountId,
        transferDate, amount: Number(amount), transferMethod,
        referenceNo: referenceNo || null, purpose: purpose || null,
        requestedBy: user?.id ?? null,
      });
      toast.success("Transfer created");
      router.push(`/accounts/transfers/company/${created.id}`);
    } catch { toast.error("Failed to create transfer"); }
    finally { setSaving(false); }
  };

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New company transfer" description="Transfer funds between companies."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/transfers/company">Back</Link></Button>} />
      <form onSubmit={submit}>
        <Card><CardHeader><CardTitle className="text-base">Transfer details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <motion className="space-y-1"><Label>Transfer no</Label><Input value={transferNo} onChange={(e) => setTransferNo(e.target.value)} required /></motion>
            <motion className="space-y-1"><Label>Date</Label><Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required /></motion>
            <motion className="space-y-1"><Label>From company</Label>
              <NativeSelect value={fromCompanyId} required onChange={(e) => { setFromCompanyId(e.target.value); setFromAccountId(""); }}>
                <NativeSelectOption value="" disabled>Select…</NativeSelectOption>
                {companies.map((c) => <NativeSelectOption key={c.entityId} value={c.entityId}>{c.companyNameEn}</NativeSelectOption>)}
              </NativeSelect></motion>
            <motion className="space-y-1"><Label>To company</Label>
              <NativeSelect value={toCompanyId} required onChange={(e) => { setToCompanyId(e.target.value); setToAccountId(""); }}>
                <NativeSelectOption value="" disabled>Select…</NativeSelectOption>
                {companies.map((c) => <NativeSelectOption key={c.entityId} value={c.entityId}>{c.companyNameEn}</NativeSelectOption>)}
              </NativeSelect></motion>
            <AccountPicker companyId={fromCompanyId || null} value={fromAccountId} onChange={setFromAccountId} label="From account" required />
            <AccountPicker companyId={toCompanyId || null} value={toAccountId} onChange={setToAccountId} label="To account" required />
            <motion className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></motion>
            <motion className="space-y-1"><Label>Transfer method</Label>
              <NativeSelect value={transferMethod} onChange={(e) => setTransferMethod(e.target.value as typeof transferMethod)}>
                {PAYMENT_METHODS.map((m) => <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}
              </NativeSelect></motion>
            <motion className="space-y-1"><Label>Reference</Label><Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} /></motion>
            <motion className="space-y-1"><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></motion>
          </CardContent>
        </Card>
        <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create transfer"}</Button>
      </form>
    </motion>
  );
}
''')

w("transfers/company/[id]/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { CompanyMoneyTransferDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CompanyTransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<CompanyMoneyTransferDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getCompanyMoneyTransfer(id)); }
    catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<CompanyMoneyTransferDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></motion>;
  if (!row) return <motion className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></motion>;

  return (
    <motion className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.transferNo} description={row.transferDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/transfers/company">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(row.amount)}</p>
          <p><span className="text-muted-foreground">Method:</span> {row.transferMethod}</p>
          <p><span className="text-muted-foreground">Purpose:</span> {row.purpose ?? "—"}</p>
        </CardContent>
      </Card>
      {companyId && (
        <motion className="flex flex-wrap gap-2">
          {row.status === "Pending" && (
            <>
              <Button disabled={acting} onClick={() => act(() => accountsService.approveCompanyMoneyTransfer(id, userId), "Approved")}>Approve</Button>
              <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.rejectCompanyMoneyTransfer(id, userId), "Rejected")}>Reject</Button>
            </>
          )}
          {row.status === "Approved" && (
            <Button disabled={acting} onClick={() => act(() => accountsService.transferCompanyMoney(id, userId), "Transferred")}>Transfer</Button>
          )}
        </motion>
      )}
    </motion>
  );
}
''')

# ── 24-33: Reports ──────────────────────────────────────────────────────────

w("reports/ledger/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { AccountPicker } from "@/components/accounts/account-picker";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { LedgerTable } from "@/components/accounts/ledger-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { GeneralLedgerEntryDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function LedgerReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [accountId, setAccountId] = useState("");
  const [entries, setEntries] = useState<GeneralLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId || !accountId) return;
    setLoading(true);
    try { setEntries(await accountsService.getLedger({ companyId, accountId, ...range })); }
    catch { toast.error("Failed to load ledger"); setEntries([]); }
    finally { setLoading(false); }
  }, [companyId, accountId, range]);
  useEffect(() => { if (companyId && accountId) run(); }, [companyId, accountId, range, run]);
  return (
    <AccountsListShell title="General ledger" description="Account-wise ledger entries.">
      <DateRangeFilter value={range} onChange={setRange} />
      <AccountPicker companyId={companyId} value={accountId} onChange={setAccountId} label="Account" required />
      <Button size="sm" onClick={run} disabled={loading || !accountId}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><LedgerTable entries={entries} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/cash-book/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { LedgerTable } from "@/components/accounts/ledger-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { GeneralLedgerEntryDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function CashBookReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [entries, setEntries] = useState<GeneralLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setEntries(await accountsService.getCashBook({ companyId, ...range })); }
    catch { toast.error("Failed to load cash book"); setEntries([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Cash book" description="All cash account movements.">
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><LedgerTable entries={entries} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/bank-book/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { LedgerTable } from "@/components/accounts/ledger-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { GeneralLedgerEntryDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function BankBookReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [entries, setEntries] = useState<GeneralLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setEntries(await accountsService.getBankBook({ companyId, ...range })); }
    catch { toast.error("Failed to load bank book"); setEntries([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Bank book" description="All bank account movements.">
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><LedgerTable entries={entries} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/daily-expense/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function DailyExpenseReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getDailyExpenseReport({ companyId, ...range })); }
    catch { toast.error("Failed to load report"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Daily expense report" description="Expense summary by category for a date range.">
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/monthly-expense/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MonthlyExpenseReportPage() {
  const { companyId } = useAccountsCompany();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getMonthlyExpenseReport({ companyId, year, month })); }
    catch { toast.error("Failed to load report"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, year, month]);
  useEffect(() => { if (companyId) run(); }, [companyId, year, month, run]);
  return (
    <AccountsListShell title="Monthly expense report" description="Expense summary for a calendar month.">
      <motion className="flex flex-wrap items-end gap-3">
        <motion className="space-y-1"><Label className="text-xs">Year</Label>
          <Input type="number" className="h-9 w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} /></motion>
        <motion className="space-y-1"><Label className="text-xs">Month</Label>
          <Input type="number" min={1} max={12} className="h-9 w-20" value={month} onChange={(e) => setMonth(Number(e.target.value))} /></motion>
      </motion>
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/trial-balance/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { ReportExportButtons } from "@/components/accounts/report-export-buttons";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function TrialBalanceReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const params = companyId ? { companyId, ...range } : { companyId: "" };
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getTrialBalance({ companyId, ...range })); }
    catch { toast.error("Failed to load trial balance"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Trial balance" description="Debit and credit balances by account."
      actions={companyId ? <ReportExportButtons basePath="trial-balance" params={params} filePrefix="trial-balance" formats={["csv", "xlsx", "pdf"]} /> : undefined}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/profit-loss/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { ReportExportButtons } from "@/components/accounts/report-export-buttons";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfitLossReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const params = companyId ? { companyId, ...range } : { companyId: "" };
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getProfitLoss({ companyId, ...range })); }
    catch { toast.error("Failed to load P&L"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Profit & loss" description="Income and expense statement."
      actions={companyId ? <ReportExportButtons basePath="profit-loss" params={params} filePrefix="profit-loss" /> : undefined}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/balance-sheet/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { ReportExportButtons } from "@/components/accounts/report-export-buttons";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { todayIso } from "@/lib/accounts-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function BalanceSheetReportPage() {
  const { companyId } = useAccountsCompany();
  const [asOfDate, setAsOfDate] = useState(todayIso());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const params = companyId ? { companyId, asOfDate } : { companyId: "" };
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getBalanceSheet({ companyId, asOfDate })); }
    catch { toast.error("Failed to load balance sheet"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, asOfDate]);
  useEffect(() => { if (companyId) run(); }, [companyId, asOfDate, run]);
  return (
    <AccountsListShell title="Balance sheet" description="Assets, liabilities, and equity as of a date."
      actions={companyId ? <ReportExportButtons basePath="balance-sheet" params={params} filePrefix="balance-sheet" /> : undefined}>
      <motion className="space-y-1"><Label className="text-xs">As of date</Label>
        <Input type="date" className="h-9 w-40" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} /></motion>
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/cash-flow/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { ReportExportButtons } from "@/components/accounts/report-export-buttons";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function CashFlowReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const params = companyId ? { companyId, ...range } : { companyId: "" };
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getCashFlow({ companyId, ...range })); }
    catch { toast.error("Failed to load cash flow"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Cash flow" description="Cash inflows and outflows."
      actions={companyId ? <ReportExportButtons basePath="cash-flow" params={params} filePrefix="cash-flow" /> : undefined}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
''')

w("reports/company-transfers/page.tsx", '''
"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { CompanyMoneyTransferDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function CompanyTransfersReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [rows, setRows] = useState<CompanyMoneyTransferDto[]>([]);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getCompanyTransferReport({ companyId, ...range })); }
    catch { toast.error("Failed to load report"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Company transfer report" description="Inter-company transfer history.">
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/transfers/company/${r.id}`}>{r.transferNo}</Link></TableCell>
                  <TableCell>{r.transferDate}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/transfers/company/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
''')

if __name__ == "__main__":
    print(f"\nCreated {len(CREATED)} files:")
    for f in CREATED:
        print(f"  {f}")
