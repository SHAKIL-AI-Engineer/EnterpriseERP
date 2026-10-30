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
import { employeeService } from "@/lib/services/employee";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "On Leave",
  "Resigned",
  "Terminated",
  "Probation",
];

type StatusChangeSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  companyId?: number;
  onSuccess?: () => void;
};

export function StatusChangeSheet({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  companyId,
  onSuccess,
}: StatusChangeSheetProps) {
  const [status, setStatus] = React.useState("Inactive");
  const [effectiveDate, setEffectiveDate] = React.useState<Date | undefined>(
    new Date(),
  );
  const [remarks, setRemarks] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!effectiveDate) {
      toast.error("Effective date is required");
      return;
    }
    setSubmitting(true);
    try {
      await employeeService.changeStatus(employeeId, {
        status,
        effectiveFrom: format(effectiveDate, "yyyy-MM-dd"),
        remarks: remarks || undefined,
        companyId,
      });
      toast.success(`Status updated to ${status}`);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Change status</SheetTitle>
          <SheetDescription>{employeeName}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New status</Label>
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label>Effective date</Label>
            <DatePicker date={effectiveDate} setDate={setEffectiveDate} />
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
