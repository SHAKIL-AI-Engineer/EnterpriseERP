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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New advance salary" description="Issue salary advance with deduction schedule."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/advances/salary">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Advance details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1"><Label>Advance no</Label><Input value={advanceSalaryNo} onChange={(e) => setAdvanceSalaryNo(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Employee ID</Label><Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Deduction start year</Label><Input type="number" value={deductionStartYear} onChange={(e) => setDeductionStartYear(Number(e.target.value))} required /></div>
              <div className="space-y-1"><Label>Deduction start month</Label><Input type="number" min={1} max={12} value={deductionStartMonth} onChange={(e) => setDeductionStartMonth(Number(e.target.value))} required /></div>
              <div className="space-y-1"><Label>Installment amount</Label><Input type="number" min={0} step="0.01" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} required /></div>
              <AccountPicker companyId={companyId} value={paidFromAccountId} onChange={setPaidFromAccountId} label="Paid from account" required />
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create advance"}</Button>
        </form>
      )}
    </div>
  );
}
