import type { Company } from "@/lib/services/company";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const EMPTY_COMPANY_GUID = "00000000-0000-0000-0000-000000000000";

/** Normalize legacy numeric company `id` or GUID string to API `companyId` (Guid). */
export function resolveCompanyGuid(
  raw: string | number,
  companies?: Company[],
): string | null {
  const text = String(raw).trim();

  if (GUID_RE.test(text) && text.toLowerCase() !== EMPTY_COMPANY_GUID) {
    return text;
  }

  const numeric =
    typeof raw === "number"
      ? raw
      : /^\d+$/.test(text)
        ? Number(text)
        : NaN;

  if (!Number.isNaN(numeric) && companies?.length) {
    const match = companies.find((c) => c.id === numeric);
    if (match?.entityId && GUID_RE.test(match.entityId)) {
      return match.entityId;
    }
  }

  return null;
}

export function isValidCompanyGuid(value: string): boolean {
  return GUID_RE.test(value) && value.toLowerCase() !== EMPTY_COMPANY_GUID;
}
