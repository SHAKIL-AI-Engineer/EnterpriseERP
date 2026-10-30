"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { payrollService } from "@/lib/services/payroll";
import type { SalaryStructureDto } from "@/lib/services/payroll-types";
import { getHttpErrorMessage } from "@/lib/api-response";
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Component = { componentCode: string; componentName: string; componentType: string; calculationType: string; amount: number; percentage: number; basedOnComponentCode: string | null; isTaxable: boolean };
const defaults = (): Component[] => [["BASIC", "Basic salary"], ["HOUSE", "House rent"], ["MEDICAL", "Medical allowance"], ["CONVEYANCE", "Conveyance"], ["FOOD", "Food allowance"]].map(([code,name]) => ({ componentCode: code, componentName: name, componentType: "Earning", calculationType: "Fixed", amount: 0, percentage: 0, basedOnComponentCode: null, isTaxable: false }));
export default function SalaryGradePage() {
 const [company, setCompany] = useState(""); const [rows, setRows] = useState<SalaryStructureDto[]>([]);
 const [loading, setLoading] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
 const [open, setOpen] = useState(false); const [editing, setEditing] = useState<string | null>(null);
 const [code, setCode] = useState(""); const [name, setName] = useState(""); const [components, setComponents] = useState<Component[]>(defaults);
 const reload = useCallback(async () => {
  if (!company) { setRows([]); return; } setLoading(true); setError("");
  try { setRows(await payrollService.getSalaryStructures(company)); } catch(e) { setRows([]); setError(getHttpErrorMessage(e, "Unable to load salary structures.")); } finally { setLoading(false); }
 },[company]);
 useEffect(() => { void reload(); },[reload]);
 function edit(row?: SalaryStructureDto) { setEditing(row?.id ?? null); setCode(row?.structureCode ?? ""); setName(row?.structureName ?? ""); setComponents(row ? row.components.map(c => ({...c, basedOnComponentCode: c.basedOnComponentCode ?? null})) : defaults()); setOpen(true); }
 function change(index: number, values: Partial<Component>) { setComponents(items => items.map((c,i) => i === index ? {...c,...values} : c)); }
 async function save() {
  setBusy(true);
  try { const body = { companyId: company, structureCode: code, structureName: name, gradeId: null, components: components.map(c => ({ ...c, companyId: company })) };
   if (editing) await api.put(`salary-structures/${editing}`, body); else await payrollService.createSalaryStructure(body);
   toast.success("Salary structure saved."); setOpen(false); await reload();
  } catch(e) { toast.error(getHttpErrorMessage(e, "Unable to save salary structure.")); } finally { setBusy(false); }
 }
 async function deactivate(id: string) { setBusy(true); try { await api.delete(`salary-structures/${id}`); toast.success("Structure deactivated; history retained."); await reload(); } catch(e) { toast.error(getHttpErrorMessage(e, "Unable to deactivate structure.")); } finally { setBusy(false); } }
 return <div className="space-y-6 p-4 lg:p-6"><div className="flex justify-between gap-3"><div><h1 className="text-2xl font-semibold">Salary grades and structures</h1><p className="text-muted-foreground">Create and maintain company pay structures. Deactivation retains payroll history.</p></div><Button disabled={!company || busy} onClick={() => edit()}>Create structure</Button></div>
  <div className="flex gap-3"><ScopedCompanySelect value={company} onChange={setCompany}/><Button variant="outline" disabled={!company || loading} onClick={() => void reload()}>Refresh</Button></div>
  {error && <p role="alert" className="text-destructive">{error}</p>}
  {loading ? <p>Loading…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{["Code", "Structure", "Components", "Status", "Actions"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b"><td className="p-2">{row.structureCode}</td><td className="p-2">{row.structureName}</td><td className="p-2">{row.components.length}</td><td className="p-2">{row.isActive ? "Active" : "Inactive"}</td><td className="p-2"><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => edit(row)}>Edit</Button>{row.isActive && <Button variant="outline" disabled={busy} onClick={() => void deactivate(row.id)}>Deactivate</Button>}</div></td></tr>)}</tbody></table>{rows.length === 0 && <p className="py-8 text-muted-foreground">{company ? "No salary structures saved for this company." : "Select a company."}</p>}</div>}
  <Dialog open={open} onOpenChange={v => { if (!busy) setOpen(v); }}><DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit salary structure" : "Create salary structure"}</DialogTitle></DialogHeader>
   <div className="grid gap-3 sm:grid-cols-2"><label>Structure code<Input maxLength={50} value={code} onChange={e => setCode(e.target.value)}/></label><label>Structure name<Input maxLength={150} value={name} onChange={e => setName(e.target.value)}/></label></div>
   <p className="text-sm text-muted-foreground">Fixed components use an amount. Percentage components use a percentage and the code of the component they are based on.</p>
   {components.map((c,i) => <div key={i} className="grid gap-2 rounded border p-3 sm:grid-cols-3"><label className="text-sm">Component code<Input value={c.componentCode} maxLength={50} onChange={e => change(i,{componentCode:e.target.value.toUpperCase()})}/></label><label className="text-sm">Name<Input value={c.componentName} onChange={e => change(i,{componentName:e.target.value})}/></label>
    <label className="text-sm">Type<NativeSelect value={c.componentType} onChange={e => change(i,{componentType:e.target.value})}><option>Earning</option><option>Deduction</option></NativeSelect></label>
    <label className="text-sm">Calculation<NativeSelect value={c.calculationType} onChange={e => change(i,{calculationType:e.target.value})}><option>Fixed</option><option>Percentage</option></NativeSelect></label>
    <label className="text-sm">{c.calculationType === "Percentage" ? "Percentage" : "Amount (BDT)"}<Input type="number" min="0" step="0.01" value={c.calculationType === "Percentage" ? c.percentage : c.amount} onChange={e => change(i,c.calculationType === "Percentage" ? {percentage:Number(e.target.value)} : {amount:Number(e.target.value)})}/></label>
    {c.calculationType === "Percentage" ? <label className="text-sm">Based on component<Input value={c.basedOnComponentCode ?? ""} onChange={e => change(i,{basedOnComponentCode:e.target.value.toUpperCase() || null})}/></label> : <div/>}
    <Button variant="outline" disabled={busy} onClick={() => setComponents(items => items.filter((_,n) => n !== i))}>Remove component</Button>
   </div>)}
   <div className="flex gap-2"><Button variant="outline" onClick={() => setComponents(items => [...items,{componentCode:`COMPONENT_${items.length+1}`,componentName:"",componentType:"Earning",calculationType:"Fixed",amount:0,percentage:0,basedOnComponentCode:null,isTaxable:false}])}>Add component</Button><Button disabled={busy || !name.trim() || !code.trim() || components.length === 0} onClick={() => void save()}>{busy ? "Saving…" : "Save structure"}</Button></div>
  </DialogContent></Dialog>
 </div>;
}
