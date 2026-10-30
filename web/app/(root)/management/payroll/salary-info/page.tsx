"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { payrollService } from "@/lib/services/payroll";
import type { EmployeeSalaryDto } from "@/lib/services/payroll-types";
import { getHttpErrorMessage, unwrapApiData } from "@/lib/api-response";
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Employee = { id: string; employeeID: string; fullName: string };
const empty = () => ({ grossSalary: 0, basicSalary: 0, houseRent: 0, medicalAllowance: 0, conveyanceAllowance: 0, foodAllowance: 0, salaryCalculationType: "Monthly", effectiveFrom: new Date().toLocaleDateString("en-CA") });
export default function SalaryInformationPage() {
 const [company,setCompany] = useState(""); const [employee,setEmployee] = useState(""); const [employees,setEmployees] = useState<Employee[]>([]);
 const [search,setSearch] = useState(""); const [rows,setRows] = useState<EmployeeSalaryDto[]>([]); const [form,setForm] = useState(empty);
 const [busy,setBusy] = useState(false); const [error,setError] = useState("");
 const findEmployees = useCallback(async () => {
  if (!company) return; setError("");
  try { const payload = unwrapApiData<{ items: Employee[] }>((await api.get("hr/Employees", {params:{companyId:company,searchTerm:search,page:1,pageSize:100}})).data); setEmployees(payload.items); }
  catch(e) { setEmployees([]); setError(getHttpErrorMessage(e,"Unable to load employees.")); }
 },[company,search]);
 useEffect(() => { setEmployee(""); setRows([]); setForm(empty()); setEmployees([]); if(company) void findEmployees(); },[company]);
 const reload = useCallback(async () => {
  if(!company || !employee) return; setError(""); setBusy(true);
  try { const history = await payrollService.getEmployeeSalaryHistory(employee,company); setRows(history);
   const current = history.find(s => s.isCurrent); setForm(current ? {grossSalary:current.grossSalary,basicSalary:current.basicSalary,houseRent:current.houseRent,medicalAllowance:current.medicalAllowance,conveyanceAllowance:current.conveyanceAllowance,foodAllowance:current.foodAllowance,salaryCalculationType:current.salaryCalculationType,effectiveFrom:current.effectiveFrom} : empty());
  } catch(e) { setRows([]); setError(getHttpErrorMessage(e,"Unable to load salary history.")); } finally { setBusy(false); }
 },[company,employee]);
 useEffect(() => { setRows([]); setForm(empty()); if(employee) void reload(); },[reload]);
 async function save() { setBusy(true); try { await payrollService.assignEmployeeSalary({...form,companyId:company,employeeId:employee,salaryStructureId:rows.find(s=>s.isCurrent)?.salaryStructureId ?? null,createdBy:null}); toast.success("Salary assignment saved."); await reload(); } catch(e) { toast.error(getHttpErrorMessage(e,"Unable to save salary assignment.")); } finally { setBusy(false); } }
 return <div className="space-y-6 p-4 lg:p-6"><h1 className="text-2xl font-semibold">Employee salary information</h1><p className="text-muted-foreground">View saved payroll salary assignments and their effective dates. Each new assignment retains the previous salary in history.</p>
  <div className="flex flex-wrap gap-3"><ScopedCompanySelect value={company} onChange={setCompany}/><Input className="max-w-xs" aria-label="Find employee" placeholder="Search employee name or ID" value={search} onChange={e=>setSearch(e.target.value)}/><Button variant="outline" disabled={!company || busy} onClick={()=>void findEmployees()}>Find employees</Button></div>
  <NativeSelect aria-label="Employee" value={employee} disabled={busy} onChange={e=>setEmployee(e.target.value)}><option value="">Select employee (search to find more)</option>{employees.map(e=><option key={e.id} value={e.id}>{e.employeeID} · {e.fullName}</option>)}</NativeSelect>
  {error && <p role="alert" className="text-destructive">{error}</p>}
  {employee && <><Card><CardHeader><CardTitle>Assign salary</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3">{([['grossSalary','Gross salary'],['basicSalary','Basic salary'],['houseRent','House rent'],['medicalAllowance','Medical allowance'],['conveyanceAllowance','Conveyance'],['foodAllowance','Food allowance']] as const).map(([key,label])=><label key={key} className="text-sm">{label} (BDT)<Input type="number" min="0" step="0.01" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:Number(e.target.value)}))}/></label>)}
   <label className="text-sm">Effective from<Input type="date" value={form.effectiveFrom} onChange={e=>setForm(f=>({...f,effectiveFrom:e.target.value}))}/></label><label className="text-sm">Calculation<NativeSelect value={form.salaryCalculationType} onChange={e=>setForm(f=>({...f,salaryCalculationType:e.target.value}))}><option>Monthly</option><option>Daily</option></NativeSelect></label></div>
   <Button disabled={busy || form.grossSalary<=0 || !form.effectiveFrom} onClick={()=>void save()}>{busy ? "Working…" : "Save salary assignment"}</Button></CardContent></Card>
   <h2 className="font-semibold">Salary history</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{["Effective from","Effective to","Gross (BDT)","Basic (BDT)","Calculation","Status"].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b"><td className="p-2">{row.effectiveFrom}</td><td className="p-2">{row.effectiveTo || "—"}</td><td className="p-2">{row.grossSalary.toLocaleString()}</td><td className="p-2">{row.basicSalary.toLocaleString()}</td><td className="p-2">{row.salaryCalculationType}</td><td className="p-2">{row.isCurrent ? "Current" : "Previous"}</td></tr>)}</tbody></table>{rows.length===0 && <p className="py-6 text-muted-foreground">No payroll salary assignments saved for this employee.</p>}</div></>}
 </div>;
}
