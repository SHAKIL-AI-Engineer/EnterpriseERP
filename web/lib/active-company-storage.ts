import { isValidCompanyGuid } from "@/lib/company-id";

const ACTIVE_KEY = "erp.activeCompanyId";
const ALLOWED_KEY = "erp.allowedCompanyIds";

function parseJwtCompanyIds(accessToken: string): string[] {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return [];
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    const raw = payload.company_ids;
    if (!raw) return [];
    const ids = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(ids)) return [];
    return ids.map(String).filter(isValidCompanyGuid);
  } catch {
    return [];
  }
}

export function getStoredAllowedCompanyIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALLOWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(isValidCompanyGuid);
  } catch {
    return [];
  }
}

/** Persist allowed company GUIDs and pick a valid active company for API headers. */
export function syncActiveCompanyStorage(options: {
  allowedCompanyIds: string[];
  defaultCompanyId?: string | null;
  isSuperAdmin?: boolean;
  accessToken?: string;
}): void {
  if (typeof window === "undefined") return;

  let allowed = options.allowedCompanyIds.filter(isValidCompanyGuid);

  if (allowed.length === 0 && options.accessToken) {
    allowed = parseJwtCompanyIds(options.accessToken);
  }

  localStorage.setItem(ALLOWED_KEY, JSON.stringify(allowed));

  if (options.isSuperAdmin) {
    const stored = localStorage.getItem(ACTIVE_KEY);
    if (stored && isValidCompanyGuid(stored)) {
      return;
    }
    const preferred =
      options.defaultCompanyId && isValidCompanyGuid(options.defaultCompanyId)
        ? options.defaultCompanyId
        : allowed[0] ?? null;
    if (preferred) {
      localStorage.setItem(ACTIVE_KEY, preferred);
    }
    return;
  }

  const stored = localStorage.getItem(ACTIVE_KEY);
  const preferred =
    options.defaultCompanyId && isValidCompanyGuid(options.defaultCompanyId)
      ? options.defaultCompanyId
      : null;

  const next =
    stored && allowed.includes(stored)
      ? stored
      : preferred && allowed.includes(preferred)
        ? preferred
        : allowed[0] ?? null;

  if (next) {
    localStorage.setItem(ACTIVE_KEY, next);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

function resolveAllowedIds(isSuperAdmin: boolean): string[] {
  let allowed = getStoredAllowedCompanyIds();
  if (allowed.length === 0 && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      allowed = parseJwtCompanyIds(token);
    }
  }
  return allowed;
}

/** Value safe to send as `X-Company-Id` (must be in the user's allowed set unless super-admin). */
export function getActiveCompanyHeaderValue(isSuperAdmin = false): string | null {
  if (typeof window === "undefined") return null;
  const active = localStorage.getItem(ACTIVE_KEY);
  if (!active || !isValidCompanyGuid(active)) return null;

  if (isSuperAdmin) return active;

  const allowed = resolveAllowedIds(isSuperAdmin);
  if (allowed.length === 0) {
    return null;
  }
  return allowed.includes(active) ? active : allowed[0] ?? null;
}

export function clearActiveCompanyStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(ALLOWED_KEY);
}

export function setActiveCompanyId(id: string): void {
  if (typeof window === "undefined") return;
  if (!isValidCompanyGuid(id)) return;
  localStorage.setItem(ACTIVE_KEY, id);
}

export { ACTIVE_KEY, ALLOWED_KEY };
