"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { parseIsoDateString, toIsoDateString } from "@/components/security/security-date-utils";

type SecurityDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  fromYear?: number;
  toYear?: number;
  captionLayout?: "label" | "dropdown";
};

export function SecurityDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  fromYear = 2020,
  toYear = new Date().getFullYear() + 5,
  captionLayout = "dropdown",
}: SecurityDatePickerProps) {
  return (
    <DatePicker
      variant="button"
      date={parseIsoDateString(value)}
      setDate={(d) => onChange(toIsoDateString(d))}
      placeholder={placeholder}
      className={cn("w-full", className)}
      fromYear={fromYear}
      toYear={toYear}
      captionLayout={captionLayout}
    />
  );
}
