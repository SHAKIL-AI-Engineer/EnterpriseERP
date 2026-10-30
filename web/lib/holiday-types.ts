/** Backend HolidayType enum values (LeaveService.Domain.Enums.HolidayType). */
export type HolidayTypeValue = "Government" | "Company" | "Festival" | "Special";

export const HOLIDAY_TYPE_OPTIONS: { value: HolidayTypeValue; label: string }[] = [
  { value: "Government", label: "Public (Government)" },
  { value: "Company", label: "Company" },
  { value: "Festival", label: "Religious / Festival (Eid)" },
  { value: "Special", label: "Special leave" },
];

export const HOLIDAY_NAME_PRESETS: { name: string; type: HolidayTypeValue }[] = [
  { name: "Eid-ul-Fitr", type: "Festival" },
  { name: "Eid-ul-Adha", type: "Festival" },
  { name: "Special leave", type: "Special" },
];

/** Map legacy UI/API strings to current enum values. */
export function normalizeHolidayType(type: string): HolidayTypeValue {
  switch (type) {
    case "Government":
    case "Company":
    case "Festival":
    case "Special":
      return type;
    case "Public":
      return "Government";
    case "Religious":
      return "Festival";
    default:
      return "Government";
  }
}

export function holidayTypeLabel(type: string): string {
  const normalized = normalizeHolidayType(type);
  return HOLIDAY_TYPE_OPTIONS.find((o) => o.value === normalized)?.label ?? type;
}
