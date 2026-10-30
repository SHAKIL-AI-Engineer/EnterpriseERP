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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New money receipt" description="Create a money receipt."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/receipts/money">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1"><Label>Receipt no</Label><Input value={moneyReceiptNo} onChange={(e) => setMoneyReceiptNo(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Received from</Label><Input value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)} required /></div>
              <div className="space-y-1"><Label>From type</Label>
                <NativeSelect value={receivedFromType} onChange={(e) => setReceivedFromType(e.target.value as typeof receivedFromType)}>
                  {RECEIVED_FROM_TYPES.map((t) => <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>)}
                </NativeSelect></div>
              <div className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Payment method</Label>
                <NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
                  {PAYMENT_METHODS.map((m) => <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}
                </NativeSelect></div>
              <AccountPicker companyId={companyId} value={cashOrBankAccountId} onChange={setCashOrBankAccountId} label="Cash/bank account" required />
              <div className="space-y-1 sm:col-span-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create receipt"}</Button>
        </form>
      )}
    </div>
  );
}
