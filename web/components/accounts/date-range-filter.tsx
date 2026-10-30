"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export type DateRange = { fromDate: string; toDate: string };

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">From</Label>
        <Input
          type="date"
          className="h-9 w-40"
          value={value.fromDate}
          onChange={(e) => onChange({ ...value, fromDate: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">To</Label>
        <Input
          type="date"
          className="h-9 w-40"
          value={value.toDate}
          onChange={(e) => onChange({ ...value, toDate: e.target.value })}
        />
      </div>
    </div>
  );
}

export function defaultMonthRange(): DateRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    fromDate: from.toISOString().split("T")[0],
    toDate: to.toISOString().split("T")[0],
  };
}
