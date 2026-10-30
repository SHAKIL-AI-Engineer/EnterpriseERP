"use client";

import * as React from "react";
import { IconClock, IconPlus } from "@tabler/icons-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";
import {
  shiftService,
  Shift,
  ShiftCategory,
  ShiftPolicy,
  ShiftBreak,
  CreateShiftDto,
  createDefaultShiftPolicy,
} from "@/lib/services/shift";

const CATEGORY_OPTIONS: { value: ShiftCategory; label: string; crossDay: boolean; general: boolean }[] = [
  { value: "GeneralDuty", label: "General Duty (Day)", crossDay: false, general: true },
  { value: "Day", label: "Day Shift", crossDay: false, general: false },
  { value: "Night", label: "Night Shift", crossDay: true, general: false },
];

const WEEKDAY_OPTIONS = [
  { value: "", label: "No weekly off" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function formatWeeklyOff(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return WEEKDAY_OPTIONS.find((d) => d.value === String(value))?.label ?? "-";
}

function formatTimeForInput(timeSpan?: string) {
  if (!timeSpan) return "";
  return timeSpan.substring(0, 5);
}

function toTimeSpan(v: string) {
  return v.length === 5 ? `${v}:00` : v;
}

export function ShiftManagementHub() {
  const { companies, isCompanyLocked, defaultCompany } = useCompanyFilterScope();
  const [selectedCompany, setSelectedCompany] = React.useState("all");
  const didInitCompanyRef = React.useRef(false);

  React.useEffect(() => {
    if (didInitCompanyRef.current || !defaultCompany?.entityId) return;
    didInitCompanyRef.current = true;
    setSelectedCompany(defaultCompany.entityId);
  }, [defaultCompany]);

  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedShiftId, setSelectedShiftId] = React.useState<string>("");
  const [policy, setPolicy] = React.useState<ShiftPolicy | null>(null);
  const [breaks, setBreaks] = React.useState<ShiftBreak[]>([]);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<Partial<CreateShiftDto & { id?: string }>>({});

  const companyIdParam = React.useMemo(
    () => (selectedCompany !== "all" ? selectedCompany : undefined),
    [selectedCompany],
  );

  const loadShifts = React.useCallback(async () => {
    try {
      if (!companyIdParam) {
        setShifts([]);
        setSelectedShiftId("");
        return;
      }
      setLoading(true);
      const list = await shiftService.getShifts({ companyId: companyIdParam });
      setShifts(Array.isArray(list) ? list : []);
      if (list?.length && !selectedShiftId) setSelectedShiftId(list[0].id);
    } catch {
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [companyIdParam, selectedShiftId]);

  const loadPolicyAndBreaks = React.useCallback(async () => {
    if (!selectedShiftId) {
      setPolicy(null);
      setBreaks([]);
      return;
    }
    const shift = shifts.find((s) => s.id === selectedShiftId);
    try {
      const detail = await shiftService.getShiftDetail(selectedShiftId);
      setPolicy(
        detail.policy ??
          ({
            id: "",
            ...createDefaultShiftPolicy(selectedShiftId, shift?.shiftCategory ?? "GeneralDuty"),
          } as ShiftPolicy)
      );
      setBreaks(detail.breaks ?? []);
    } catch {
      setPolicy({
        id: "",
        ...createDefaultShiftPolicy(selectedShiftId, shift?.shiftCategory ?? "GeneralDuty"),
      } as ShiftPolicy);
      setBreaks([]);
      toast.error("Could not load policy from server — showing defaults. Save to create policy.");
    }
  }, [selectedShiftId, shifts]);

  React.useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  React.useEffect(() => {
    loadPolicyAndBreaks();
  }, [loadPolicyAndBreaks]);

  const openCreate = () => {
    setEditing(false);
    const cat = CATEGORY_OPTIONS[0];
    setForm({
      companyId: companyIdParam || "",
      shiftName: "",
      shiftType: cat.value,
      shiftCategory: cat.value,
      punchWindowBeforeMinutes: 60,
      startTime: "08:00:00",
      endTime: "17:00:00",
      isCrossDay: cat.crossDay,
      isGeneralDuty: cat.general,
      isDefault: false,
      weeklyOffDayOfWeek: null,
    });
    setSheetOpen(true);
  };

  const openEdit = (s: Shift) => {
    setEditing(true);
    setForm({ ...s, id: s.id });
    setSheetOpen(true);
  };

  const onCategoryChange = (cat: ShiftCategory) => {
    const opt = CATEGORY_OPTIONS.find((c) => c.value === cat)!;
    setForm((f) => ({
      ...f,
      shiftCategory: cat,
      shiftType: cat,
      isCrossDay: opt.crossDay,
      isGeneralDuty: opt.general,
    }));
  };

  const saveShift = async () => {
    if (!form.companyId) {
      toast.error("Select a company");
      return;
    }
    const dto: CreateShiftDto = {
      companyId: form.companyId,
      shiftName: form.shiftName || "",
      shiftType: form.shiftType || "GeneralDuty",
      shiftCategory: (form.shiftCategory as ShiftCategory) || "GeneralDuty",
      punchWindowBeforeMinutes: form.punchWindowBeforeMinutes ?? 60,
      startTime: toTimeSpan(form.startTime || "08:00"),
      endTime: toTimeSpan(form.endTime || "17:00"),
      isCrossDay: !!form.isCrossDay,
      isGeneralDuty: !!form.isGeneralDuty,
      isDefault: !!form.isDefault,
      weeklyOffDayOfWeek:
        form.weeklyOffDayOfWeek === null || form.weeklyOffDayOfWeek === undefined
          ? null
          : Number(form.weeklyOffDayOfWeek),
    };
    try {
      if (editing && form.id) {
        await shiftService.updateShift(form.id, { ...dto, id: form.id });
        toast.success("Shift updated");
      } else {
        await shiftService.createShift(dto);
        toast.success("Shift created");
      }
      setSheetOpen(false);
      loadShifts();
    } catch {
      toast.error("Failed to save shift");
    }
  };

  const savePolicy = async () => {
    if (!selectedShiftId || !policy) return;
    try {
      await shiftService.upsertPolicy(selectedShiftId, { ...policy, shiftId: selectedShiftId });
      toast.success("Policy saved");
      loadPolicyAndBreaks();
    } catch {
      toast.error("Failed to save policy");
    }
  };

  const shiftColumns: ColumnDef<Shift>[] = [
    { accessorKey: "shiftName", header: "Name" },
    {
      accessorKey: "shiftCategory",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{String(row.getValue("shiftCategory"))}</Badge>,
    },
    {
      accessorKey: "startTime",
      header: "Start",
      cell: ({ row }) => formatTimeForInput(row.getValue("startTime") as string),
    },
    {
      accessorKey: "endTime",
      header: "End",
      cell: ({ row }) => formatTimeForInput(row.getValue("endTime") as string),
    },
    {
      accessorKey: "weeklyOffDayOfWeek",
      header: "Weekly Off",
      cell: ({ row }) => formatWeeklyOff(row.original.weeklyOffDayOfWeek),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
          {row.getValue("isActive") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IconClock className="size-6 text-primary" />
            <h1 className="text-2xl font-bold">Shift Management</h1>
          </div>
          <p className="text-muted-foreground">Core shift setup, policies, breaks, and shift-level weekly off.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <IconPlus className="size-4" /> Create Shift
        </Button>
      </div>

      <div className="w-64">
        <Label className="text-xs font-bold text-muted-foreground">Company</Label>
        <ScopedCompanySelect
          value={selectedCompany === "all" ? "" : selectedCompany}
          onChange={(entityId) => setSelectedCompany(entityId || "all")}
          showAllOption={!isCompanyLocked}
          allOptionLabel="All Companies"
          className="h-10"
        />
      </div>

      <Tabs defaultValue="shifts">
        <TabsList>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="mt-4">
          <DataTable
            data={shifts}
            columns={shiftColumns}
            onEditClick={openEdit}
            onDelete={(s) => shiftService.deactivateShift(s.id).then(loadShifts)}
            isLoading={loading}
            showColumnCustomizer={false}
          />
        </TabsContent>

        <TabsContent value="policy" className="mt-4 space-y-4 max-w-lg">
          <NativeSelect value={selectedShiftId} onChange={(e) => setSelectedShiftId(e.target.value)}>
            <option value="">Select shift</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.shiftName}</option>
            ))}
          </NativeSelect>
          {selectedShiftId && policy && (
            <>
              {[
                ["lateAfterMinutes", "Late after (min)"],
                ["earlyOutBeforeMinutes", "Early out before (min)"],
                ["overtimeStartAfterMinutes", "OT after shift end (min)"],
                ["lunchBreakMinutes", "Lunch deduct (min)"],
                ["minimumOvertimeMinutes", "Min OT (min)"],
                ["maximumOvertimeMinutes", "Max OT (min)"],
              ].map(([key, label]) => (
                <div key={key} className="grid gap-1">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    value={policy[key as keyof ShiftPolicy] as number}
                    onChange={(e) =>
                      setPolicy({ ...policy, [key]: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={policy.deductLunchFromWorking}
                  onCheckedChange={(v) => setPolicy({ ...policy, deductLunchFromWorking: !!v })}
                />
                <Label>Deduct lunch from working time</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={policy.holidayWorkAllAsOvertime}
                  onCheckedChange={(v) => setPolicy({ ...policy, holidayWorkAllAsOvertime: !!v })}
                />
                <Label>Holiday work = full OT</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={policy.weeklyOffWorkAllAsOvertime}
                  onCheckedChange={(v) => setPolicy({ ...policy, weeklyOffWorkAllAsOvertime: !!v })}
                />
                <Label>Weekly off work = full OT</Label>
              </div>
              <Button onClick={savePolicy}>Save policy</Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="breaks" className="mt-4">
          <NativeSelect className="mb-4 w-64" value={selectedShiftId} onChange={(e) => setSelectedShiftId(e.target.value)}>
            <option value="">Select shift</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.shiftName}</option>
            ))}
          </NativeSelect>
          <ul className="space-y-2">
            {breaks.map((b) => (
              <li key={b.id} className="border rounded p-3 text-sm">
                {b.breakName} ({b.breakMinutes} min) {formatTimeForInput(b.breakStartTime)}–{formatTimeForInput(b.breakEndTime)}
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit shift" : "New shift"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category</Label>
              <NativeSelect
                value={form.shiftCategory || "GeneralDuty"}
                onChange={(e) => onCategoryChange(e.target.value as ShiftCategory)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label>Company</Label>
              <NativeSelect
                value={form.companyId || ""}
                onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
              >
                <option value="">Select</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.entityId}>{c.companyNameEn}</option>
                ))}
              </NativeSelect>
            </div>
            <Input placeholder="Shift name" value={form.shiftName || ""} onChange={(e) => setForm((f) => ({ ...f, shiftName: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start</Label>
                <Input type="time" value={formatTimeForInput(form.startTime)} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="time" value={formatTimeForInput(form.endTime)} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Weekly Off</Label>
              <NativeSelect
                value={form.weeklyOffDayOfWeek === null || form.weeklyOffDayOfWeek === undefined ? "" : String(form.weeklyOffDayOfWeek)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    weeklyOffDayOfWeek: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              >
                {WEEKDAY_OPTIONS.map((d) => (
                  <option key={d.value || "none"} value={d.value}>{d.label}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={!!form.isDefault} onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: !!v }))} />
              <Label>Default shift for company</Label>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
            <Button onClick={saveShift}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AssignmentForm({
  companyId,
  shifts,
  onDone,
  mode,
}: {
  companyId?: string;
  shifts: Shift[];
  onDone: () => void;
  mode: "assign" | "temp";
}) {
  const [employeeId, setEmployeeId] = React.useState("");
  const [shiftId, setShiftId] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState("");
  const [shiftDate, setShiftDate] = React.useState("");
  const submit = async () => {
    if (!companyId || !employeeId || !shiftId) {
      toast.error("Fill all fields");
      return;
    }
    try {
      if (mode === "assign") {
        await shiftService.assignEmployeeShift({
          companyId,
          employeeId,
          shiftId,
          effectiveFrom: effectiveFrom || new Date().toISOString(),
        });
        toast.success("Shift assigned");
      } else {
        await shiftService.assignTemporaryShift({
          companyId,
          employeeId,
          shiftId,
          shiftDate: shiftDate || new Date().toISOString().slice(0, 10),
        });
        toast.success("Temporary shift saved");
      }
      onDone();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <>
      <Input placeholder="Employee ID (GUID)" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
      <NativeSelect value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
        <option value="">Shift</option>
        {shifts.map((s) => (
          <option key={s.id} value={s.id}>{s.shiftName}</option>
        ))}
      </NativeSelect>
      {mode === "assign" ? (
        <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
      ) : (
        <Input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
      )}
      <Button onClick={submit}>Save</Button>
    </>
  );
}

function CalendarForm({ companyId, shifts }: { companyId?: string; shifts: Shift[] }) {
  const [date, setDate] = React.useState("");
  const [dayType, setDayType] = React.useState("SpecialWorkingDay");
  const [shiftId, setShiftId] = React.useState("");

  const submit = async () => {
    if (!companyId || !date) return;
    try {
      await shiftService.createCalendarEntry({
        companyId,
        calendarDate: date,
        dayType,
        shiftId: shiftId || null,
      });
      toast.success("Calendar entry created");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <>
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <NativeSelect value={dayType} onChange={(e) => setDayType(e.target.value)}>
        <option value="WorkingDay">Working Day</option>
        <option value="WeeklyOff">Weekly Off</option>
        <option value="Holiday">Holiday</option>
        <option value="SpecialWorkingDay">Special Working Day</option>
      </NativeSelect>
      <NativeSelect value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
        <option value="">Optional shift</option>
        {shifts.map((s) => (
          <option key={s.id} value={s.id}>{s.shiftName}</option>
        ))}
      </NativeSelect>
      <Button onClick={submit}>Add entry</Button>
    </>
  );
}

function EvaluationPreview({ companyId }: { companyId?: string }) {
  const [employeeId, setEmployeeId] = React.useState("");
  const [date, setDate] = React.useState("");
  const [result, setResult] = React.useState<string>("");
  const run = async () => {
    if (!companyId || !employeeId || !date) return;
    try {
      const ev = await shiftService.evaluate(companyId, employeeId, date);
      setResult(JSON.stringify(ev, null, 2));
    } catch {
      toast.error("Evaluation failed");
    }
  };

  return (
    <>
      <Input placeholder="Employee ID (GUID)" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button onClick={run}>Preview</Button>
      {result && <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">{result}</pre>}
    </>
  );
}
