"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  IconFilter,
  IconLoader2,
  IconSearch,
  IconUserExclamation,
  IconUsers,
} from "@tabler/icons-react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { HrFilterCard } from "@/components/hr/hr-filter-card";
import { HrPageHeader } from "@/components/hr/hr-page-header";
import { HrPageShell } from "@/components/hr/hr-page-shell";
import { HrTableCard } from "@/components/hr/hr-table-card";
import { StatusChangeSheet } from "@/components/hr/status-change-sheet";
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";
import { employeeService, type Employee } from "@/lib/services/employee";
import {
  organogramService,
  type Department,
  type Designation,
  type Group,
  type Line,
  type Section,
} from "@/lib/services/organogram";

type EmployeeRow = Omit<Employee, "id"> & { id: string };
type OrganogramFilter = "All" | number;
type SeparationAction = "Resign" | "Close";

export default function SeparationsPage() {
  const { loading: authLoading } = useAuth();
  const { companies } = useCompanyFilterScope();
  const [selectedCompany, setSelectedCompany] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [employeeIdFilter, setEmployeeIdFilter] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState<OrganogramFilter>("All");
  const [sectionFilter, setSectionFilter] = React.useState<OrganogramFilter>("All");
  const [designationFilter, setDesignationFilter] = React.useState<OrganogramFilter>("All");
  const [lineFilter, setLineFilter] = React.useState<OrganogramFilter>("All");
  const [groupFilter, setGroupFilter] = React.useState<OrganogramFilter>("All");
  const [separationAction, setSeparationAction] = React.useState<SeparationAction>("Resign");

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [sections, setSections] = React.useState<Section[]>([]);
  const [designations, setDesignations] = React.useState<Designation[]>([]);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);

  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
  const [selectedEmployees, setSelectedEmployees] = React.useState<EmployeeRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = React.useState(false);
  const [effectiveDate, setEffectiveDate] = React.useState<Date | undefined>(new Date());
  const [remarks, setRemarks] = React.useState("");

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedOne, setSelectedOne] = React.useState<EmployeeRow | null>(null);

  const selectedCompanyRow = React.useMemo(
    () => companies.find((c) => c.entityId === selectedCompany),
    [companies, selectedCompany],
  );

  React.useEffect(() => {
    if (!selectedCompanyRow?.id) {
      setDepartments([]);
      return;
    }
    organogramService.getDepartments({ companyId: selectedCompanyRow.id }).then(setDepartments);
    organogramService.getGroups({ companyId: selectedCompanyRow.id }).then(setGroups);
    setDeptFilter("All");
    setSectionFilter("All");
    setDesignationFilter("All");
    setLineFilter("All");
    setGroupFilter("All");
  }, [selectedCompanyRow?.id]);

  React.useEffect(() => {
    if (deptFilter === "All") {
      setSections([]);
      return;
    }
    organogramService.getSections({ departmentId: deptFilter }).then(setSections);
    setSectionFilter("All");
  }, [deptFilter]);

  React.useEffect(() => {
    if (sectionFilter === "All") {
      setDesignations([]);
      setLines([]);
      return;
    }
    organogramService.getDesignations({ sectionId: sectionFilter }).then(setDesignations);
    organogramService.getLines({ sectionId: sectionFilter }).then(setLines);
    setDesignationFilter("All");
    setLineFilter("All");
  }, [sectionFilter]);

  const applyFilter = React.useCallback(async () => {
    if (!selectedCompanyRow?.id) {
      toast.error("Select a company");
      return;
    }
    const combined = [employeeIdFilter.trim(), searchTerm.trim()].filter(Boolean).join(" ").trim();
    setLoadingEmployees(true);
    try {
      const list = await employeeService.getEmployees({
        companyId: selectedCompanyRow.id,
        searchTerm: combined || undefined,
        status: "Active",
        departmentId: deptFilter === "All" ? undefined : deptFilter,
        sectionId: sectionFilter === "All" ? undefined : sectionFilter,
        designationId: designationFilter === "All" ? undefined : designationFilter,
      });
      let rows = list
        .filter((e) => e.entityId)
        .map((e) => ({ ...e, id: e.entityId! }));
      if (lineFilter !== "All") rows = rows.filter((e) => e.lineId === lineFilter);
      if (groupFilter !== "All") rows = rows.filter((e) => e.groupId === groupFilter);
      if (employeeIdFilter.trim()) {
        const needle = employeeIdFilter.trim().toLowerCase();
        rows = rows.filter(
          (e) =>
            e.employeeId.toLowerCase().includes(needle) ||
            String(e.punchNumber ?? "").includes(needle),
        );
      }
      setEmployees(rows);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  }, [
    deptFilter,
    designationFilter,
    employeeIdFilter,
    groupFilter,
    lineFilter,
    searchTerm,
    sectionFilter,
    selectedCompanyRow?.id,
  ]);

  React.useEffect(() => {
    if (!selectedCompany || authLoading) return;
    void applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- company change only
  }, [selectedCompany, authLoading]);

  const statusForAction = separationAction === "Resign" ? "Resigned" : "Terminated";

  const bulkApply = async () => {
    if (!effectiveDate) {
      toast.error("Effective date is required");
      return;
    }
    if (selectedEmployees.length === 0) {
      toast.error("Select at least one employee");
      return;
    }
    setApplying(true);
    let ok = 0;
    let fail = 0;
    const dateStr = format(effectiveDate, "yyyy-MM-dd");
    for (const emp of selectedEmployees) {
      if (!emp.entityId) continue;
      try {
        await employeeService.changeStatus(emp.entityId, {
          status: statusForAction,
          effectiveFrom: dateStr,
          remarks: remarks || undefined,
          companyId: selectedCompanyRow?.id,
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setApplying(false);
    setApplyDialogOpen(false);
    if (fail === 0) toast.success(`Applied ${statusForAction} to ${ok} employee(s)`);
    else toast.warning(`${ok} updated, ${fail} failed`);
    void applyFilter();
  };

  const columns: ColumnDef<EmployeeRow>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
    },
    { accessorKey: "employeeId", header: "Employee ID" },
    { accessorKey: "fullNameEn", header: "Name" },
    { accessorKey: "departmentName", header: "Department" },
    { accessorKey: "designationName", header: "Designation" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedOne(row.original);
            setSheetOpen(true);
          }}
        >
          Change
        </Button>
      ),
    },
  ];

  const applyButtonLabel =
    separationAction === "Resign" ? "Apply Resign" : "Apply Close";

  return (
    <HrPageShell>
      <HrPageHeader
        icon={<IconUserExclamation className="size-7" />}
        title="Separations"
        description="Filter employees and apply resign or close (terminated) in bulk."
      />

      <HrFilterCard
        recordCount={employees.length}
        isLoading={loadingEmployees}
        onApply={() => void applyFilter()}
        applyLabel="Apply filter"
      >
          <div className="contents sm:col-span-2 lg:col-span-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 col-span-full w-full">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Company</Label>
              <ScopedCompanySelect
                value={selectedCompany}
                onChange={(entityId) => setSelectedCompany(entityId)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Search</Label>
              <Input
                className="h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or keyword"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Employee ID</Label>
              <Input
                className="h-10 font-mono"
                value={employeeIdFilter}
                onChange={(e) => setEmployeeIdFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Action</Label>
              <NativeSelect
                value={separationAction}
                onChange={(e) => setSeparationAction(e.target.value as SeparationAction)}
                className="h-10"
              >
                <option value="Resign">Resign</option>
                <option value="Close">Close (Terminated)</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Department</Label>
              <NativeSelect
                value={deptFilter.toString()}
                onChange={(e) =>
                  setDeptFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10"
                disabled={!selectedCompany}
              >
                <option value="All">All</option>
                {departments.map((d) => (
                  <option key={d.entityId} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Section</Label>
              <NativeSelect
                value={sectionFilter.toString()}
                onChange={(e) =>
                  setSectionFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10"
                disabled={deptFilter === "All"}
              >
                <option value="All">All</option>
                {sections.map((s) => (
                  <option key={s.entityId} value={s.id}>
                    {s.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Designation</Label>
              <NativeSelect
                value={designationFilter.toString()}
                onChange={(e) =>
                  setDesignationFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10"
                disabled={sectionFilter === "All"}
              >
                <option value="All">All</option>
                {designations.map((d) => (
                  <option key={d.entityId} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Line</Label>
              <NativeSelect
                value={lineFilter.toString()}
                onChange={(e) =>
                  setLineFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10"
                disabled={sectionFilter === "All"}
              >
                <option value="All">All</option>
                {lines.map((l) => (
                  <option key={l.entityId} value={l.id}>
                    {l.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Group</Label>
              <NativeSelect
                value={groupFilter.toString()}
                onChange={(e) =>
                  setGroupFilter(e.target.value === "All" ? "All" : parseInt(e.target.value, 10))
                }
                className="h-10"
              >
                <option value="All">All</option>
                {groups.map((g) => (
                  <option key={g.entityId} value={g.id}>
                    {g.nameEn}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          </div>
          <div className="col-span-full flex flex-wrap gap-3 border-t pt-4 mt-2">
            <Button
              className="gap-2"
              disabled={selectedEmployees.length === 0 || applying}
              onClick={() => setApplyDialogOpen(true)}
            >
              <IconUsers className="size-4" />
              {applyButtonLabel}
              {selectedEmployees.length > 0 && (
                <Badge variant="secondary">{selectedEmployees.length}</Badge>
              )}
            </Button>
          </div>
      </HrFilterCard>

      <HrTableCard>
          <DataTable
            data={employees}
            columns={columns}
            enableSelection
            getRowId={(row) => row.id}
            onSelectionChange={(rows) => setSelectedEmployees(rows as EmployeeRow[])}
            isLoading={loadingEmployees}
            showTabs={false}
            showActions={false}
            searchKey="fullNameEn"
          />
      </HrTableCard>

      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{applyButtonLabel}</DialogTitle>
            <DialogDescription>
              Set status to {statusForAction} for {selectedEmployees.length} selected employee(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Effective date</Label>
              <DatePicker date={effectiveDate} setDate={setEffectiveDate} />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={bulkApply} disabled={applying}>
              {applying ? <IconLoader2 className="size-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedOne?.entityId && (
        <StatusChangeSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          employeeId={selectedOne.entityId}
          employeeName={selectedOne.fullNameEn}
          companyId={selectedCompanyRow?.id}
          onSuccess={() => void applyFilter()}
        />
      )}
    </HrPageShell>
  );
}
