"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { getHttpErrorMessage, unwrapApiData } from "@/lib/api-response";
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Operation = { id: string; employeeId: string; employeeName: string; title: string; notes: string; status: string; startedAt: string; completedAt?: string };
type Payload = { items: Operation[]; employees: { id: string; fullName: string; employeeID: string }[] };

export function HrOperationsPage({ kind }: { kind: "Movement" | "Lifecycle" }) {
  const [company, setCompany] = useState(""); const [data, setData] = useState<Payload>({ items: [], employees: [] });
  const [employee, setEmployee] = useState(""); const [title, setTitle] = useState(""); const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const reload = useCallback(async () => {
    if (!company) { setData({ items: [], employees: [] }); return; }
    setLoading(true); setError("");
    try { setData(unwrapApiData<Payload>((await api.get("hr/operations", { params: { companyId: company, kind } })).data)); }
    catch (e) { setData({ items: [], employees: [] }); setError(getHttpErrorMessage(e, "Unable to load records.")); }
    finally { setLoading(false); }
  }, [company, kind]);
  useEffect(() => { setEmployee(""); void reload(); }, [reload]);
  async function create() {
    setBusy(true);
    try { await api.post("hr/operations", { companyId: company, employeeId: employee, kind, title, notes });
      setTitle(""); setNotes(""); toast.success("Record saved."); await reload(); }
    catch (e) { toast.error(getHttpErrorMessage(e, "Unable to save record.")); } finally { setBusy(false); }
  }
  async function complete(id: string) {
    setBusy(true);
    try { await api.post(`hr/operations/${id}/complete`, null, { params: { companyId: company } }); toast.success(kind === "Movement" ? "Return recorded." : "Task completed."); await reload(); }
    catch (e) { toast.error(getHttpErrorMessage(e, "Unable to complete record.")); } finally { setBusy(false); }
  }
  return <div className="space-y-6 p-4 lg:p-6"><h1 className="text-2xl font-semibold">{kind === "Movement" ? "Employee movement register" : "Employee lifecycle tasks"}</h1>
    <p className="text-muted-foreground">{kind === "Movement" ? "Record departures and returns during working hours." : "Track onboarding, probation, review and offboarding tasks for employees."}</p>
    <ScopedCompanySelect value={company} onChange={setCompany}/>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Card><CardHeader><CardTitle>{kind === "Movement" ? "Record a departure" : "Create a lifecycle task"}</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <NativeSelect aria-label="Employee" value={employee} onChange={e => setEmployee(e.target.value)} disabled={loading || !company}><option value="">Select employee</option>{data.employees.map(e => <option key={e.id} value={e.id}>{e.employeeID} · {e.fullName}</option>)}</NativeSelect>
      <Input aria-label="Title" placeholder={kind === "Movement" ? "Destination / reason" : "Task title (for example: probation review)"} maxLength={200} value={title} onChange={e => setTitle(e.target.value)}/>
      <Input aria-label="Notes" placeholder="Notes" maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)}/>
      <Button disabled={busy || loading || !company || !employee || !title.trim()} onClick={() => void create()}>Save record</Button>
    </CardContent></Card>
    <div className="flex justify-between"><h2 className="font-semibold">Saved records</h2><Button variant="outline" disabled={loading || !company} onClick={() => void reload()}>Refresh</Button></div>
    {loading ? <p>Loading…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{["Employee", "Title / notes", kind === "Movement" ? "Out time" : "Created", kind === "Movement" ? "Return time" : "Completed", "Status"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>
      {data.items.map(row => <tr key={row.id} className="border-b"><td className="p-2">{row.employeeName}</td><td className="p-2">{row.title}<p className="text-muted-foreground">{row.notes}</p></td><td className="p-2">{new Date(row.startedAt).toLocaleString()}</td><td className="p-2">{row.completedAt ? new Date(row.completedAt).toLocaleString() : "—"}</td><td className="p-2">{row.status === "Open" ? <Button disabled={busy} onClick={() => void complete(row.id)}>{kind === "Movement" ? "Record return" : "Complete task"}</Button> : row.status}</td></tr>)}
    </tbody></table>{data.items.length === 0 && <p className="py-8 text-center text-muted-foreground">{company ? "No saved records for this company." : "Select a company to view records."}</p>}<p className="mt-3 text-xs text-muted-foreground">Shows the latest 1,000 records. Timestamps come from the server.</p></div>}
  </div>;
}
