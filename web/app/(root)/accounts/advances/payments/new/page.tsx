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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New advance payment" description="Issue an advance to employee or supplier."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/advances/payments">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Advance details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1"><Label>Advance no</Label><Input value={advanceNo} onChange={(e) => setAdvanceNo(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Advance type</Label>
                <NativeSelect value={advanceType} onChange={(e) => setAdvanceType(e.target.value as typeof advanceType)}>
                  {ADVANCE_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></div>
              <div className="space-y-1"><Label>Paid to type</Label>
                <NativeSelect value={paidToType} onChange={(e) => setPaidToType(e.target.value as typeof paidToType)}>
                  {PAID_TO_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></div>
              <div className="space-y-1"><Label>Paid to name</Label><Input value={paidToName} onChange={(e) => setPaidToName(e.target.value)} /></div>
              <AccountPicker companyId={companyId} value={paidFromAccountId} onChange={setPaidFromAccountId} label="Paid from account" required />
              <div className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create advance"}</Button>
        </form>
      )}
    </div>
  );
}
