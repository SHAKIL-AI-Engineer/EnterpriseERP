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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New daily expense" description="Record a daily expense."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/expenses/daily">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Expense details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1"><Label>Expense no</Label><Input value={expenseNo} onChange={(e) => setExpenseNo(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Category</Label>
                <NativeSelect value={expenseCategoryId} required onChange={(e) => setExpenseCategoryId(e.target.value)}>
                  <NativeSelectOption value="" disabled>Select category…</NativeSelectOption>
                  {categories.map((c) => <NativeSelectOption key={c.id} value={c.id}>{c.categoryCode} — {c.categoryName}</NativeSelectOption>)}
                </NativeSelect></div>
              <AccountPicker companyId={companyId} value={paidFromAccountId} onChange={setPaidFromAccountId} label="Paid from account" required />
              <div className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Payment method</Label>
                <NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
                  {PAYMENT_METHODS.map((m) => <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>)}
                </NativeSelect></div>
              <div className="space-y-1"><Label>Paid to</Label><Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Create expense"}</Button>
        </form>
      )}
    </div>
  );
}
