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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New company transfer" description="Transfer funds between companies."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/transfers/company">Back</Link></Button>} />
      <form onSubmit={submit}>
        <Card><CardHeader><CardTitle className="text-base">Transfer details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Transfer no</Label><Input value={transferNo} onChange={(e) => setTransferNo(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required /></div>
            <div className="space-y-1"><Label>From company</Label>
              <NativeSelect value={fromCompanyId} required onChange={(e) => { setFromCompanyId(e.target.value); setFromAccountId(""); }}>
                <NativeSelectOption value="" disabled>Select…</NativeSelectOption>
                {companies.map((c) => <NativeSelectOption key={c.entityId} value={c.entityId}>{c.companyNameEn}</NativeSelectOption>)}
              </NativeSelect></div>
            <div className="space-y-1"><Label>To company</Label>
              <NativeSelect value={toCompanyId} required onChange={(e) => { setToCompanyId(e.target.value); setToAccountId(""); }}>
                <NativeSelectOption value="" disabled>Select…</NativeSelectOption>
                {companies.map((c) => <NativeSelectOption key={c.entityId} value={c.entityId}>{c.companyNameEn}</NativeSelectOption>)}
              </NativeSelect></div>
            <AccountPicker companyId={fromCompanyId || null} value={fromAccountId} onChange={setFromAccountId} label="From account" required />
            <AccountPicker companyId={toCompanyId || null} value={toAccountId} onChange={setToAccountId} label="To account" required />
            <div className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Transfer method</Label>
              <NativeSelect value={transferMethod} onChange={(e) => setTransferMethod(e.target.value as typeof transferMethod)}>
                {PAYMENT_METHODS.map((m) => <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}
              </NativeSelect></div>
            <div className="space-y-1"><Label>Reference</Label><Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} /></div>
            <div className="space-y-1"><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
          </CardContent>
        </Card>
        <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create transfer"}</Button>
      </form>
    </div>
  );
}
