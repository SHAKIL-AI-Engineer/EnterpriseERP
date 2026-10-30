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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New voucher" description="Create a multi-line journal voucher."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/vouchers">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company to continue.</p> : (
        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Header</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1"><Label>Voucher no</Label>
                <Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Date</Label>
                <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Type</Label>
                <NativeSelect value={voucherType} onChange={(e) => setVoucherType(e.target.value)}>
                  {VOUCHER_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></div>
              <div className="space-y-1"><Label>Reference</Label>
                <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Narration</Label>
                <Input value={narration} onChange={(e) => setNarration(e.target.value)} /></div>
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
    </div>
  );
}
