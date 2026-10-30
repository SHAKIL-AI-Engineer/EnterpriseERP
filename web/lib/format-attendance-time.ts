import { format, isValid, parseISO } from "date-fns";

const TIME_ONLY = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Backend attendance reports often send `HH:mm`; full ISO datetimes are also supported. */
export function formatPunchTime(
  value?: string | null,
  attendanceDate?: string,
): string {
  if (!value?.trim()) return "--:--";

  const trimmed = value.trim();

  if (attendanceDate && TIME_ONLY.test(trimmed)) {
    const datePart = attendanceDate.split("T")[0];
    const withSeconds = trimmed.length <= 5 ? `${trimmed}:00` : trimmed;
    const combined = parseISO(`${datePart}T${withSeconds}`);
    if (isValid(combined)) {
      return format(combined, "hh:mm aa");
    }
  }

  if (trimmed.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = parseISO(trimmed);
    if (isValid(parsed)) {
      return format(parsed, "hh:mm aa");
    }
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return format(direct, "hh:mm aa");
  }

  const match = TIME_ONLY.exec(trimmed);
  if (match) {
    const hours = Number(match[1]);
    const minutes = match[2];
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  }

  return trimmed;
}

/** Build a Date for datetime pickers from punch text + attendance date. */
export function parsePunchTimeToDate(
  value?: string | null,
  attendanceDate?: string,
): Date | undefined {
  if (!value?.trim()) return undefined;

  const trimmed = value.trim();

  if (attendanceDate) {
    const datePart = attendanceDate.split("T")[0];
    const withSeconds = TIME_ONLY.test(trimmed) && trimmed.length <= 5
      ? `${trimmed}:00`
      : trimmed;
    const combined = parseISO(`${datePart}T${withSeconds}`);
    if (isValid(combined)) return combined;
  }

  const iso = parseISO(trimmed);
  if (isValid(iso)) return iso;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  return undefined;
}

export function formatAttendanceDate(value?: string | null): string {
  if (!value?.trim()) return "-";
  const datePart = value.split("T")[0];
  const parsed = parseISO(datePart);
  if (isValid(parsed)) {
    return format(parsed, "dd MMM yyyy");
  }
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return format(direct, "dd MMM yyyy");
  }
  return value;
}

export function formatAttendanceWeekday(value?: string | null): string {
  if (!value?.trim()) return "";
  const datePart = value.split("T")[0];
  const parsed = parseISO(datePart);
  if (isValid(parsed)) {
    return format(parsed, "EEEE");
  }
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return format(direct, "EEEE");
  }
  return "";
}
