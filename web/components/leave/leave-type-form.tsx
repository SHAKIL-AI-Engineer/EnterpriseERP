"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { leaveService } from "@/lib/services/leave";
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select";

export type LeaveTypeFormValues = {
  name: string;
  code: string;
  yearlyLimit: number;
  isCarryForward: boolean;
  description: string;
};

const defaultValues: LeaveTypeFormValues = {
  name: "",
  code: "",
  yearlyLimit: 0,
  isCarryForward: false,
  description: "",
};

type LeaveTypeFormProps = {
  initial?: LeaveTypeFormValues;
  editingTypeId?: string;
  editingPolicyId?: string;
  defaultCompanyEntityId?: string;
  onSuccess?: () => void;
  cancelHref?: string;
};

export function LeaveTypeForm({
  initial,
  editingTypeId,
  editingPolicyId,
  defaultCompanyEntityId,
  onSuccess,
  cancelHref = "/management/leave/leave-type",
}: LeaveTypeFormProps) {
  const router = useRouter();
  const [companyEntityId, setCompanyEntityId] = React.useState(defaultCompanyEntityId ?? "");
  const [formData, setFormData] = React.useState<LeaveTypeFormValues>(initial ?? defaultValues);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!companyEntityId || !formData.name || !formData.code) {
      toast.error("Company, name, and code are required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingTypeId) {
        await leaveService.updateLeaveType(editingTypeId, {
          leaveName: formData.name,
          isPaid: true,
          isCarryForward: formData.isCarryForward,
          maxCarryForwardDays: formData.isCarryForward ? 10 : 0,
          isEncashable: true,
        });
        if (editingPolicyId) {
          await leaveService.updateLeavePolicy(editingPolicyId, {
            yearlyEntitlement: formData.yearlyLimit,
            monthlyAccrual: parseFloat((formData.yearlyLimit / 12).toFixed(2)),
            minServiceMonths: 0,
            requiresApproval: true,
            allowHalfDay: true,
            allowNegativeBalance: false,
            excludeHolidaysFromLeaveDays: true,
            excludeWeeklyOffFromLeaveDays: true,
            approvalLevelCount: 1,
            isActive: true,
          });
        }
        toast.success("Leave type updated");
      } else {
        const newType = await leaveService.createLeaveType({
          companyId: companyEntityId,
          leaveCode: formData.code,
          leaveName: formData.name,
          isPaid: true,
          isCarryForward: formData.isCarryForward,
          maxCarryForwardDays: formData.isCarryForward ? 10 : 0,
          isEncashable: true,
        });
        await leaveService.createLeavePolicy({
          companyId: companyEntityId,
          leaveTypeId: newType.id,
          yearlyEntitlement: formData.yearlyLimit,
          monthlyAccrual: parseFloat((formData.yearlyLimit / 12).toFixed(2)),
          minServiceMonths: 0,
          requiresApproval: true,
          allowHalfDay: true,
          allowNegativeBalance: false,
          excludeHolidaysFromLeaveDays: true,
          excludeWeeklyOffFromLeaveDays: true,
          approvalLevelCount: 1,
        });
        toast.success("Leave type created");
      }
      onSuccess?.();
      router.push(cancelHref);
    } catch {
      toast.error("Failed to save leave type");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label>Company</Label>
        <ScopedCompanySelect
          value={companyEntityId}
          onChange={(entityId) => setCompanyEntityId(entityId)}
          disabled={!!editingTypeId}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label>Leave name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            disabled={!!editingTypeId}
          />
        </div>
        <div className="space-y-2">
          <Label>Days / year</Label>
          <Input
            type="number"
            value={formData.yearlyLimit}
            onChange={(e) =>
              setFormData((p) => ({ ...p, yearlyLimit: parseInt(e.target.value, 10) || 0 }))
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={formData.isCarryForward}
          onCheckedChange={(v) => setFormData((p) => ({ ...p, isCarryForward: !!v }))}
        />
        <Label>Allow carry forward</Label>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving…" : editingTypeId ? "Update" : "Create"}
        </Button>
        <Button variant="outline" onClick={() => router.push(cancelHref)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
