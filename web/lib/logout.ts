import axios from "axios";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import { clearActiveCompanyStorage } from "@/lib/active-company-storage";
import { clearSessionCookie } from "@/lib/auth-cookie-sync";

const LOGOUT_FLAG = "hrhub:logout-in-progress";

/** Set synchronously before clearing storage so in-flight requests skip refresh/retry. */
export function beginLogout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOGOUT_FLAG, "1");
}

export function isLogoutInProgress(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(LOGOUT_FLAG) === "1";
}

export function clearLogoutFlag(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGOUT_FLAG);
}

export function clearAllClientSession(): void {
  if (typeof window === "undefined") return;
  clearSessionCookie();
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  clearActiveCompanyStorage();
}

/**
 * Revoke refresh token (best-effort), clear all client session data, redirect to login.
 * Uses hard navigation so React state and pending requests are discarded.
 */
export async function performLogout(): Promise<void> {
  if (typeof window === "undefined") return;

  beginLogout();

  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  clearAllClientSession();

  try {
    if (token || refreshToken) {
      await axios.post(
        `${getPublicApiBaseUrl()}/auth/revoke`,
        refreshToken ? { refreshToken } : {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          timeout: 8000,
          validateStatus: () => true,
        },
      );
    }
  } catch {
    /* silent — client session is already cleared */
  }

  clearLogoutFlag();
  window.location.replace("/login");
}
