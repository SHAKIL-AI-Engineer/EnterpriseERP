"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { getHttpErrorMessage, unwrapApiData } from "@/lib/api-response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Backup = { id: string; databaseKey: string; databaseName: string; fileName: string; serverPath: string; status: string; createdAt: string };
export function DatabaseBackupsPage() {
  const [data, setData] = useState<{ databases: string[]; items: Backup[] }>({ databases: [], items: [] });
  const [selected, setSelected] = useState("HrDb"); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [restore, setRestore] = useState<Backup | null>(null); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const reload = useCallback(async () => { try { setData(unwrapApiData((await api.get("database/backups")).data)); setError(""); }
    catch (e) { setError(getHttpErrorMessage(e, "Unable to load backups. SuperAdmin access is required.")); } }, []);
  useEffect(() => { void reload(); }, [reload]);
  async function run(path: string, body?: unknown) {
    setBusy(true);
    try { await api.post(path, body, { timeout: 660000 }); toast.success("Operation completed."); setRestore(null); setPassword(""); setConfirm(""); await reload(); }
    catch (e) { toast.error(getHttpErrorMessage(e, "The database operation failed. Review server permissions and backup storage.")); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6 p-4 lg:p-6"><h1 className="text-2xl font-semibold">Database backups</h1>
    <p className="text-muted-foreground">Create a real SQL Server backup and verify it before use. Files are stored on the database server at the path shown below.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Card><CardHeader><CardTitle>Create a backup</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">
      <NativeSelect aria-label="Database" value={selected} disabled={busy} onChange={e => setSelected(e.target.value)}>{data.databases.map(key => <option key={key} value={key}>{key}</option>)}</NativeSelect>
      <Button disabled={busy || data.databases.length === 0} onClick={() => void run("database/backup", { databaseKey: selected })}>{busy ? "Working…" : "Create and verify backup"}</Button>
      <Button variant="outline" disabled={busy} onClick={() => void reload()}>Refresh</Button>
    </CardContent></Card>
    {restore && <Card><CardHeader><CardTitle>Restore {restore.databaseName}</CardTitle></CardHeader><CardContent className="space-y-3">
      <p className="text-destructive">This replaces the current database contents and disconnects active users. Create a fresh backup and schedule a maintenance window first.</p>
      <Input aria-label="Confirm database name" placeholder={`Type ${restore.databaseName}`} value={confirm} onChange={e => setConfirm(e.target.value)}/>
      <Input aria-label="Current password" type="password" autoComplete="current-password" placeholder="Your current password" value={password} onChange={e => setPassword(e.target.value)}/>
      <div className="flex gap-2"><Button variant="destructive" disabled={busy || confirm !== restore.databaseName || !password} onClick={() => void run(`database/backups/${restore.id}/restore`, { currentPassword: password, confirmDatabase: confirm })}>Confirm database replacement</Button>
      <Button variant="outline" disabled={busy} onClick={() => { setRestore(null); setPassword(""); }}>Cancel</Button></div>
    </CardContent></Card>}
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{["Database / file", "Created", "Status", "Actions"].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{data.items.map(row => <tr className="border-b" key={row.id}>
      <td className="p-2"><div>{row.databaseName}</div><div className="break-all text-muted-foreground">{row.serverPath}</div></td><td className="p-2">{new Date(row.createdAt).toLocaleString()}</td><td className="p-2">{row.status}</td><td className="p-2"><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => void run(`database/backups/${row.id}/verify`)}>Verify</Button>{row.status === "Verified" && row.databaseKey !== "AuthDb" && <Button variant="outline" disabled={busy} onClick={() => { setRestore(row); setConfirm(""); setPassword(""); }}>Restore…</Button>}</div></td>
    </tr>)}</tbody></table>{data.items.length === 0 && <p className="py-8 text-center text-muted-foreground">No backups created through this application yet.</p>}</div>
    <p className="text-sm text-muted-foreground">SQL Server needs permission to write its backup directory. Authentication database restoration requires the offline maintenance procedure.</p>
  </div>;
}
