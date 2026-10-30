"use client";

import { DateTimePicker } from "@/components/ui/datetime-picker";
import { cn } from "@/lib/utils";
import {
  parseDateTimeLocalString,
  toDateTimeLocalString,
} from "@/components/security/security-date-utils";

type SecurityDateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  fromYear?: number;
  toYear?: number;
};

export function SecurityDateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  fromYear = 2020,
  toYear = new Date().getFullYear() + 5,
}: SecurityDateTimePickerProps) {
  return (
    <DateTimePicker
      variant="button"
      date={parseDateTimeLocalString(value)}
      setDate={(d) => onChange(toDateTimeLocalString(d))}
      placeholder={placeholder}
      className={cn("w-full", className)}
      fromYear={fromYear}
      toYear={toYear}
    />
  );
}
