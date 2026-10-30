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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title="New money request" description="Submit a fund requisition."
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/requests/money">Back</Link></Button>} />
      {!companyId ? <p className="text-muted-foreground">Select a company.</p> : (
        <form onSubmit={submit}>
          <Card><CardHeader><CardTitle className="text-base">Request details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1"><Label>Request no</Label><Input value={requestNo} onChange={(e) => setRequestNo(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} required /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Requested amount</Label><Input type="number" min={0} step="0.01" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} required /></div>
              <div className="space-y-1"><Label>Department ID</Label><Input value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} /></div>
            </CardContent>
          </Card>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Submit request"}</Button>
        </form>
      )}
    </div>
  );
}
