import { format, isValid, parse } from "date-fns";

/** Parse API / filter date string `yyyy-MM-dd` */
export function parseIsoDateString(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = parse(value.trim(), "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

/** Format as `yyyy-MM-dd` for API query params and DateOnly fields */
export function toIsoDateString(date: Date | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

/** Parse `datetime-local` value or ISO string */
export function parseDateTimeLocalString(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return isValid(d) ? d : undefined;
}

/** Format for `datetime-local` and API DateTime (local, no Z) */
export function toDateTimeLocalString(date: Date | undefined): string {
  if (!date || !isValid(date)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${format(date, "yyyy-MM-dd")}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function todayIsoDate(): string {
  return toIsoDateString(new Date());
}

export function nowDateTimeLocal(): string {
  return toDateTimeLocalString(new Date());
}
