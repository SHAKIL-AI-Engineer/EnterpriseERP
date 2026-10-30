"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { unwrapApiData, firstApiErrorMessage } from "@/lib/api-response";
import { companyService, type Company } from "@/lib/services/company";
import { authService } from "@/lib/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Request = { id: string; userId: string; userName: string; fullName: string; email: string;
  requestedBy: string; requestedByName?: string; reviewedByName?: string; requestedAt: string; rolesJson: string; companiesJson: string;
  status: string; reviewedBy?: string; reviewedAt?: string; reason: string };
function list(value: string): string[] { try { return JSON.parse(value); } catch { return []; } }

export default function AccountApprovalsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rows, setRows] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [filter, setFilter] = useState("Pending");
  const actor = authService.getCurrentUser()?.id;
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(unwrapApiData<Request[]>((await api.get("administrator/account-approvals")).data)); setCompanies(await companyService.getAll().catch(() => [])); }
    catch (e) { setError(firstApiErrorMessage((e as { response?: { data?: unknown } }).response?.data) || "Unable to load account approvals."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  async function decide(row: Request, approve: boolean, bootstrapReviewer = false) {
    if (!approve && !reason[row.id]?.trim()) { toast.error("Enter a rejection reason."); return; }
    setBusy(row.id);
    try { await api.post(`administrator/account-approvals/${row.id}/decision`, { approve, reason: reason[row.id] || "", bootstrapReviewer, currentPassword: bootstrapReviewer ? password : undefined });
      toast.success(approve ? "Account approved." : "Account rejected."); setPassword(""); await reload(); }
    catch (e) { toast.error(firstApiErrorMessage((e as { response?: { data?: unknown } }).response?.data) || "The decision could not be saved."); }
    finally { setBusy(null); }
  }
  return <div className="space-y-6 p-4 lg:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">User account approvals</h1>
      <p className="text-sm text-muted-foreground">Review new accounts and requested access. A different administrator must approve each request.</p></div>
      <Button variant="outline" disabled={loading} onClick={() => void reload()}>Refresh</Button></div>
    <div className="flex gap-2">{["Pending", "Approved", "Rejected", "All"].map(s => <Button key={s} variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>{s}</Button>)}
      <Button variant="link" asChild><Link href="/merchandising/approvals">Merchandising approvals</Link></Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Card><CardHeader><CardTitle>Account requests</CardTitle></CardHeader><CardContent>
      {loading ? <p>Loading requests…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">
        <th className="p-2">Account</th><th className="p-2">Requested access</th><th className="p-2">Requested</th><th className="p-2">Decision</th></tr></thead>
        <tbody>{rows.filter(r => filter === "All" || r.status === filter).map(row => <tr key={row.id} className="border-b align-top">
          <td className="p-2"><div className="font-medium">{row.fullName}</div><div>{row.userName}</div><div className="text-muted-foreground">{row.email}</div></td>
          <td className="p-2">{list(row.rolesJson).join(", ")}<div className="text-muted-foreground">{list(row.companiesJson).map(id => companies.find(c => c.entityId?.toLowerCase() === id.toLowerCase())?.companyNameEn ?? id).join(", ")}</div></td>
          <td className="p-2">{new Date(row.requestedAt).toLocaleString()}<div className="text-muted-foreground">Requested by {row.requestedByName || row.requestedBy}</div></td><td className="p-2 space-y-2">
            <div>{row.status}{row.reviewedAt && ` · ${new Date(row.reviewedAt).toLocaleString()}`}</div>
            {row.status === "Pending" ? <><Input aria-label={`Decision reason for ${row.userName}`} maxLength={2000} placeholder="Reason (required to reject)" value={reason[row.id] || ""} onChange={e => setReason(p => ({ ...p, [row.id]: e.target.value }))}/>
              {actor === row.requestedBy ? <p className="text-muted-foreground">Awaiting another administrator’s review.</p> : <div className="flex gap-2"><Button disabled={busy !== null} onClick={() => void decide(row, true)}>Approve</Button><Button variant="destructive" disabled={busy !== null} onClick={() => void decide(row, false)}>Reject</Button></div>}</> : <p>{row.reviewedByName && `Reviewed by ${row.reviewedByName}. `}{row.reason}</p>}
          </td></tr>)}</tbody></table>{rows.filter(r => filter === "All" || r.status === filter).length === 0 && <p className="py-8 text-center text-muted-foreground">No {filter.toLowerCase()} account requests.</p>}</div>}
    </CardContent></Card>
  </div>;
}
