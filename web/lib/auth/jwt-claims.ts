/** Decode JWT payload (browser-safe, no signature verify). */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function claimValues(payload: Record<string, unknown>, key: string): string[] {
  const raw = payload[key];
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return [String(raw)].filter(Boolean);
}

/** Roles from Auth-service JWT (supports multiple role claims). */
export function extractRolesFromPayload(payload: Record<string, unknown>): string[] {
  const fromRole = claimValues(payload, ROLE_CLAIM);
  const fromShort = claimValues(payload, "role");
  return [...new Set([...fromRole, ...fromShort])];
}

/** Permissions from Auth-service JWT (`permission` claim, single or array). */
export function extractPermissionsFromPayload(payload: Record<string, unknown>): string[] {
  return [...new Set(claimValues(payload, "permission"))];
}

/** True when `exp` is missing or in the past (optional skew for clock drift). */
export function isJwtExpired(
  payload: Record<string, unknown>,
  skewSeconds = 30,
): boolean {
  const exp = payload.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) {
    return true;
  }
  return Date.now() / 1000 >= exp - skewSeconds;
}

export function isAccessTokenValid(token: string | null | undefined): boolean {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  return !isJwtExpired(payload);
}
