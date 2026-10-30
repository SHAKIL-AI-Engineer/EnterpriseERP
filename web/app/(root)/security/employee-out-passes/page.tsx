"use client";

import * as React from "react";
import Link from "next/link";
import { IconPlus, IconEye, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  InOutTimeDisplay,
  SecurityStatusBadge,
  SecurityDatePicker,
  SecurityDateTimePicker,
  todayIsoDate,
  nowDateTimeLocal,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import { employeeService, type Employee } from "@/lib/services/employee";
import type { EmployeeOutPass, Gate } from "@/lib/types/security";

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function EmployeeOutPassesPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <EmployeeOutPassesContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function EmployeeOutPassesContent({ companyId }: { companyId: string }) {
  const [date, setDate] = React.useState(() => todayIsoDate());
  const [passes, setPasses] = React.useState<EmployeeOutPass[]>([]);
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [employeeSearch, setEmployeeSearch] = React.useState("");
  const [employeeResults, setEmployeeResults] = React.useState<Employee[]>([]);
  const [searchingEmployees, setSearchingEmployees] = React.useState(false);
  const [usePicker, setUsePicker] = React.useState(true);

  const [form, setForm] = React.useState({
    gateId: "",
    employeeId: "",
    passNo: "",
    passDate: todayIsoDate(),
    outTime: nowDateTimeLocal(),
    expectedReturnTime: "",
    reason: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [passRows, gateRows] = await Promise.all([
        securityService.getEmployeeOutPasses(companyId, undefined, date),
        securityService.getGates(companyId),
      ]);
      setPasses(passRows);
      setGates(gateRows.filter((g) => g.isActive));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employee out passes");
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  React.useEffect(() => {
    load();
  }, [load]);

  const gateMap = React.useMemo(
    () => new Map(gates.map((g) => [g.id, g])),
    [gates],
  );

  const searchEmployees = React.useCallback(async (term: string) => {
    if (!term.trim()) {
      setEmployeeResults([]);
      return;
    }
    setSearchingEmployees(true);
    try {
      const page = await employeeService.getEmployeesPage({
        getAll: true,
        searchTerm: term.trim(),
        status: "Active",
      });
      setEmployeeResults(page.items ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to search employees");
    } finally {
      setSearchingEmployees(false);
    }
  }, []);

  React.useEffect(() => {
    if (!usePicker) return;
    const timer = setTimeout(() => searchEmployees(employeeSearch), 300);
    return () => clearTimeout(timer);
  }, [employeeSearch, usePicker, searchEmployees]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gateId || !form.employeeId || !form.passNo || !form.reason) {
      toast.error("Gate, employee, pass no, and reason are required");
      return;
    }
    setCreating(true);
    try {
      await securityService.createEmployeeOutPass({
        companyId,
        gateId: form.gateId,
        employeeId: form.employeeId,
        passNo: form.passNo,
        passDate: form.passDate,
        outTime: toIso(form.outTime),
        expectedReturnTime: form.expectedReturnTime ? toIso(form.expectedReturnTime) : undefined,
        reason: form.reason,
      });
      toast.success("Out pass created");
      setCreateOpen(false);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create out pass");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Out Pass</h2>
          <p className="text-muted-foreground">Issue and track employee gate exit passes</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <IconPlus className="h-4 w-4" />
              New Out Pass
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Out Pass</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Gate</Label>
                <NativeSelect
                  value={form.gateId}
                  onChange={(e) => setForm((f) => ({ ...f, gateId: e.target.value }))}
                  required
                >
                  <option value="">Select gate</option>
                  {gates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.gateName} ({g.gateCode})
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Employee</Label>
                  <button
                    type="button"
                    className="text-xs text-erp-accent hover:underline"
                    onClick={() => setUsePicker((v) => !v)}
                  >
                    {usePicker ? "Enter GUID manually" : "Use employee search"}
                  </button>
                </div>
                {usePicker ? (
                  <>
                    <div className="relative">
                      <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        placeholder="Search by name or ID…"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                      />
                    </div>
                    {searchingEmployees && (
                      <p className="text-xs text-muted-foreground">Searching…</p>
                    )}
                    {employeeResults.length > 0 && (
                      <NativeSelect
                        value={form.employeeId}
                        onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                        required={!form.employeeId}
                      >
                        <option value="">Select employee</option>
                        {employeeResults.map((emp) => (
                          <option key={emp.entityId ?? emp.employeeId} value={emp.entityId ?? ""}>
                            {emp.fullNameEn} ({emp.employeeId})
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </>
                ) : (
                  <Input
                    placeholder="Employee GUID"
                    value={form.employeeId}
                    onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pass No</Label>
                  <Input
                    value={form.passNo}
                    onChange={(e) => setForm((f) => ({ ...f, passNo: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pass Date</Label>
                  <SecurityDatePicker
                    value={form.passDate}
                    onChange={(passDate) => setForm((f) => ({ ...f, passDate }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Out Time</Label>
                <SecurityDateTimePicker
                  value={form.outTime}
                  onChange={(outTime) => setForm((f) => ({ ...f, outTime }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Return</Label>
                <SecurityDateTimePicker
                  value={form.expectedReturnTime}
                  onChange={(expectedReturnTime) => setForm((f) => ({ ...f, expectedReturnTime }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create Out Pass"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <SecurityDatePicker
              value={date}
              onChange={setDate}
              className="w-52"
              placeholder="Filter date"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/60">
        <CardContent className="pt-6">
          <div className="rounded-md border border-muted-foreground/10 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Pass No</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Out / Return</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : passes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No out passes for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  passes.map((pass) => (
                    <TableRow key={pass.id}>
                      <TableCell className="font-medium">{pass.passNo}</TableCell>
                      <TableCell>{gateMap.get(pass.gateId)?.gateName ?? "—"}</TableCell>
                      <TableCell>
                        <InOutTimeDisplay
                          inTime={pass.outTime}
                          outTime={pass.actualReturnTime}
                        />
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{pass.reason}</TableCell>
                      <TableCell>
                        <SecurityStatusBadge status={pass.approvalStatus} />
                      </TableCell>
                      <TableCell>
                        <SecurityStatusBadge status={pass.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/security/employee-out-passes/${pass.id}`}>
                            <IconEye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
