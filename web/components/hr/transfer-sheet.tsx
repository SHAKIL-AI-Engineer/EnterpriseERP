"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DatePicker } from "@/components/ui/date-picker";
import { employeeService, type EmployeeSimple } from "@/lib/services/employee";
import { organogramService } from "@/lib/services/organogram";
import { toast } from "sonner";
import { format } from "date-fns";

type TransferSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeSimple[];
  companyId?: number;
  defaultEmployeeEntityId?: string;
  onSuccess?: () => void;
};

export function TransferSheet({
  open,
  onOpenChange,
  employees,
  companyId,
  defaultEmployeeEntityId,
  onSuccess,
}: TransferSheetProps) {
  const [employeeEntityId, setEmployeeEntityId] = React.useState(
    defaultEmployeeEntityId ?? "",
  );
  const [departmentId, setDepartmentId] = React.useState("");
  const [designationId, setDesignationId] = React.useState("");
  const [transferDate, setTransferDate] = React.useState<Date | undefined>(
    new Date(),
  );
  const [reason, setReason] = React.useState("");
  const [departments, setDepartments] = React.useState<
    { id: number; nameEn: string }[]
  >([]);
  const [designations, setDesignations] = React.useState<
    { id: number; nameEn: string }[]
  >([]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (defaultEmployeeEntityId) setEmployeeEntityId(defaultEmployeeEntityId);
  }, [defaultEmployeeEntityId]);

  React.useEffect(() => {
    organogramService.getDepartments().then(setDepartments);
  }, []);

  React.useEffect(() => {
    if (departmentId) {
      organogramService
        .getDesignations({ departmentId: parseInt(departmentId, 10) })
        .then(setDesignations);
    } else {
      setDesignations([]);
    }
  }, [departmentId]);

  const handleSubmit = async () => {
    if (!employeeEntityId || !departmentId || !designationId || !transferDate) {
      toast.error("Employee, department, designation, and date are required");
      return;
    }
    setSubmitting(true);
    try {
      await employeeService.transferEmployee(employeeEntityId, {
        departmentId: parseInt(departmentId, 10),
        designationId: parseInt(designationId, 10),
        effectiveFrom: format(transferDate, "yyyy-MM-dd"),
        reason,
        companyId,
      });
      toast.success("Transfer recorded");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to record transfer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Employee transfer</SheetTitle>
          <SheetDescription>Update department and designation</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <NativeSelect
              value={employeeEntityId}
              onChange={(e) => setEmployeeEntityId(e.target.value)}
              disabled={!!defaultEmployeeEntityId}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.entityId} value={e.entityId ?? ""}>
                  {e.fullNameEn} ({e.employeeId})
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <NativeSelect
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setDesignationId("");
              }}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <NativeSelect
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
            >
              <option value="">Select designation</option>
              {designations.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Effective date</Label>
            <DatePicker date={transferDate} setDate={setTransferDate} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Transfer reason"
            />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save transfer"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
