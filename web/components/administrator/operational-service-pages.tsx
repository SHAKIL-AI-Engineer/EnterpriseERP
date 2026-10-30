"use client";

import * as React from "react";
import { IconBug, IconCheck, IconPlus, IconRefresh, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { administratorService, type AdministratorBug, type AdministratorEvent, type BugReport } from "@/lib/services/administrator";

const selectClass = "h-9 rounded-lg border bg-background px-3 text-sm";
const priorities = ["Low", "Medium", "High", "Critical"];
const statuses = ["Open", "InProgress", "Resolved", "Closed"];
const blankReport: BugReport = { title: "", priority: "Medium", affectedPath: "", steps: "", expected: "", actual: "" };

function time(value: string) {
  const utc = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`;
  return new Date(utc).toLocaleString();
}

function LoadState({ loading, failed, empty }: { loading: boolean; failed: boolean; empty: boolean }) {
  if (!loading && !failed && !empty) return null;
  return <div role="status" className="p-10 text-center text-sm text-muted-foreground">{loading ? "Loading records…" : failed ? "Could not load records. Use Refresh to retry." : "No matching records yet."}</div>;
}

function AdministratorLogView({ errorsOnly = false }: { errorsOnly?: boolean }) {
  const [rows, setRows] = React.useState<AdministratorEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [unresolvedOnly, setUnresolvedOnly] = React.useState(errorsOnly);
  const [selected, setSelected] = React.useState<AdministratorEvent | null>(null);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setFailed(false);
    try { setRows(await administratorService.getLogs({ search, level, errorsOnly, unresolvedOnly, limit: 200 })); }
    catch { setFailed(true); }
    finally { setLoading(false); }
  }, [search, level, errorsOnly, unresolvedOnly]);
  React.useEffect(() => { void load(); }, [load]);

  const resolve = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await administratorService.resolveError(selected.id, !selected.resolved, notes);
      toast.success(selected.resolved ? "Error reopened" : "Error marked resolved");
      setSelected(null); await load();
    } catch { toast.error("Could not update the error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-xl font-semibold">{errorsOnly ? "Error handling" : "System logs"}</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{errorsOnly ? "Review failed API requests, record resolution notes, and reopen incidents when needed." : "Persistent audit records for API changes and failed requests handled by the Platform Host."}</p></div>
        <Button variant="outline" onClick={load} disabled={loading}><IconRefresh className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
      </div>
      <Card>
        <div className="flex flex-wrap gap-3 border-b p-4">
          <form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }} className="flex min-w-56 flex-1 gap-2">
            <Input aria-label="Search logs" placeholder="Search path, trace ID or user ID…" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
            <Button type="submit" variant="outline" aria-label="Apply log search"><IconSearch className="size-4" /></Button>
          </form>
          {!errorsOnly && <select aria-label="Log level" className={selectClass} value={level} onChange={(event) => setLevel(event.target.value)}><option value="">All levels</option><option>Information</option><option>Warning</option><option>Error</option></select>}
          {errorsOnly && <select aria-label="Error status" className={selectClass} value={unresolvedOnly ? "unresolved" : "all"} onChange={(event) => setUnresolvedOnly(event.target.value === "unresolved")}><option value="unresolved">Unresolved errors</option><option value="all">All errors</option></select>}
        </div>
        <LoadState loading={loading} failed={failed} empty={rows.length === 0} />
        {!loading && !failed && rows.length > 0 && <div className="overflow-x-auto"><Table>
          <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Request</TableHead><TableHead>HTTP</TableHead><TableHead>Duration</TableHead><TableHead>{errorsOnly ? "Resolution" : "Level"}</TableHead><TableHead className="text-right">Details</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((row) => <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap text-xs">{time(row.createdAt)}</TableCell>
            <TableCell><div className="flex items-center gap-2"><Badge variant="outline">{row.method}</Badge><span className="max-w-lg truncate font-mono text-xs" title={row.path}>{row.path}</span></div><div className="mt-1 font-mono text-[11px] text-muted-foreground">{row.traceId}</div></TableCell>
            <TableCell><Badge variant={row.statusCode >= 500 ? "destructive" : row.statusCode >= 400 ? "warning" : "success"}>{row.statusCode}</Badge></TableCell>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{row.durationMs.toLocaleString()} ms</TableCell>
            <TableCell><Badge variant={row.resolved ? "success" : "secondary"}>{errorsOnly ? row.resolved ? "Resolved" : "Open" : row.level}</Badge></TableCell>
            <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { setSelected(row); setNotes(row.resolution); }}>View</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table></div>}
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">Latest 200 matching records · Platform Host · request bodies and query strings are excluded</div>
      </Card>
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Request details</DialogTitle><DialogDescription>Use the trace ID to correlate the request with service logs.</DialogDescription></DialogHeader>
        {selected && <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 font-mono text-xs break-all">{selected.method} {selected.path}<br />HTTP {selected.statusCode} · {selected.durationMs} ms<br />Trace: {selected.traceId}<br />Actor: {selected.actor}<br />{time(selected.createdAt)}</div>
          {selected.statusCode >= 400 && <><div className="space-y-2"><Label htmlFor="resolution-notes">Resolution notes</Label><Textarea id="resolution-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} className="min-h-28" /></div>{selected.resolvedAt && <p className="text-xs text-muted-foreground">Resolved {time(selected.resolvedAt)} by {selected.resolvedBy}</p>}<DialogFooter><Button onClick={resolve} disabled={saving}><IconCheck className="mr-2 size-4" />{saving ? "Saving…" : selected.resolved ? "Reopen error" : "Mark resolved"}</Button></DialogFooter></>}
        </div>}
      </DialogContent></Dialog>
    </div>
  );
}

export function SystemLogsPage() { return <AdministratorLogView />; }
export function ErrorHandlingPage() { return <AdministratorLogView errorsOnly />; }

export function SystemBugsPage() {
  const [rows, setRows] = React.useState<AdministratorBug[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [report, setReport] = React.useState<BugReport>({ ...blankReport });
  const [selected, setSelected] = React.useState<AdministratorBug | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setFailed(false);
    try { setRows(await administratorService.getBugs({ status, search })); }
    catch { setFailed(true); }
    finally { setLoading(false); }
  }, [status, search]);
  React.useEffect(() => { void load(); }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await administratorService.reportBug(report);
      toast.success("Bug report saved"); setCreating(false); setReport({ ...blankReport }); await load();
    } catch { toast.error("Could not save the bug report"); }
    finally { setSaving(false); }
  };
  const update = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await administratorService.updateBug(selected.id, { status: selected.status, priority: selected.priority, notes: selected.notes });
      toast.success("Bug updated"); setSelected(null); await load();
    } catch { toast.error("Could not update the bug"); }
    finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-xl font-semibold">System bugs</h2><p className="mt-1 text-sm text-muted-foreground">Track reported problems, set priorities, and record progress through resolution.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={load} disabled={loading}><IconRefresh className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button><Button onClick={() => setCreating(true)}><IconPlus className="mr-2 size-4" />Report bug</Button></div>
    </div>
    <Card>
      <div className="flex flex-wrap gap-3 border-b p-4">
        <form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }} className="flex min-w-56 flex-1 gap-2"><Input aria-label="Search bugs" placeholder="Search title or affected page…" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><Button variant="outline" type="submit" aria-label="Apply bug search"><IconSearch className="size-4" /></Button></form>
        <select aria-label="Bug status" className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <LoadState loading={loading} failed={failed} empty={rows.length === 0} />
      {!loading && !failed && rows.length > 0 && <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Bug report</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}>
        <TableCell><p className="font-medium">{row.title}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{row.affectedPath || "No page specified"}</p></TableCell>
        <TableCell><Badge variant={row.priority === "Critical" ? "destructive" : row.priority === "High" ? "warning" : "secondary"}>{row.priority}</Badge></TableCell>
        <TableCell><Badge variant={row.status === "Resolved" || row.status === "Closed" ? "success" : "outline"}>{row.status}</Badge></TableCell><TableCell className="whitespace-nowrap text-xs">{time(row.updatedAt)}</TableCell><TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => setSelected({ ...row })}>Manage</Button></TableCell>
      </TableRow>)}</TableBody></Table></div>}
      <div className="border-t px-4 py-3 text-xs text-muted-foreground">Up to 500 matching reports · saved in the Administrator service database</div>
    </Card>
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><IconBug className="size-5" />Report a system bug</DialogTitle><DialogDescription>Provide enough detail to reproduce the issue.</DialogDescription></DialogHeader><form onSubmit={create} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="bug-title">Title *</Label><Input id="bug-title" required minLength={3} maxLength={160} value={report.title} onChange={(event) => setReport({ ...report, title: event.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-[1fr_150px]"><div className="space-y-2"><Label htmlFor="bug-path">Affected page</Label><Input id="bug-path" placeholder="/management/..." maxLength={1024} value={report.affectedPath} onChange={(event) => setReport({ ...report, affectedPath: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="bug-priority">Priority</Label><select id="bug-priority" className={`${selectClass} w-full`} value={report.priority} onChange={(event) => setReport({ ...report, priority: event.target.value })}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></div></div>
      <div className="space-y-2"><Label htmlFor="bug-steps">Steps to reproduce *</Label><Textarea id="bug-steps" required minLength={3} maxLength={8000} value={report.steps} onChange={(event) => setReport({ ...report, steps: event.target.value })} className="min-h-28" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="bug-expected">Expected result</Label><Textarea id="bug-expected" maxLength={4000} value={report.expected} onChange={(event) => setReport({ ...report, expected: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="bug-actual">Actual result</Label><Textarea id="bug-actual" maxLength={4000} value={report.actual} onChange={(event) => setReport({ ...report, actual: event.target.value })} /></div></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save report"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Update the status, priority and investigation notes.</DialogDescription></DialogHeader>{selected && <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="issue-status">Status</Label><select id="issue-status" className={`${selectClass} w-full`} value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value })}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div><div className="space-y-2"><Label htmlFor="issue-priority">Priority</Label><select id="issue-priority" className={`${selectClass} w-full`} value={selected.priority} onChange={(event) => setSelected({ ...selected, priority: event.target.value })}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></div></div>
      <div className="rounded-lg bg-muted p-4 text-sm"><p className="font-medium">Steps to reproduce</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{selected.steps}</p><p className="mt-3 font-medium">Expected</p><p className="whitespace-pre-wrap text-muted-foreground">{selected.expected || "Not provided"}</p><p className="mt-3 font-medium">Actual</p><p className="whitespace-pre-wrap text-muted-foreground">{selected.actual || "Not provided"}</p></div>
      <p className="break-all text-xs text-muted-foreground">Reported {time(selected.createdAt)} by {selected.reportedBy}</p>
      <div className="space-y-2"><Label htmlFor="issue-notes">Investigation / resolution notes</Label><Textarea id="issue-notes" className="min-h-28" maxLength={4000} value={selected.notes} onChange={(event) => setSelected({ ...selected, notes: event.target.value })} /></div><DialogFooter><Button onClick={update} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></DialogFooter>
    </div>}</DialogContent></Dialog>
  </div>;
}
