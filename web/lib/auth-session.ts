import axios from "axios";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import { unwrapApiData } from "@/lib/api-response";
import {
  clearActiveCompanyStorage,
  syncActiveCompanyStorage,
} from "@/lib/active-company-storage";
import { clearSessionCookie, syncSessionCookieFromLocalStorage } from "@/lib/auth-cookie-sync";
import { isLogoutInProgress, clearAllClientSession, beginLogout } from "@/lib/logout";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24;

let refreshInFlight: Promise<string | null> | null = null;

function isSuperAdminFromStorage(): boolean {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return false;
  try {
    const parsed = JSON.parse(userRaw) as { roles?: string[] };
    return parsed.roles?.includes("SuperAdmin") ?? false;
  } catch {
    return false;
  }
}

export function applySessionTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem("token", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
  document.cookie = `token=${accessToken}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  syncActiveCompanyStorage({
    allowedCompanyIds: [],
    isSuperAdmin: isSuperAdminFromStorage(),
    accessToken,
  });
}

/** Single-flight refresh so parallel 401s do not invalidate a rotated refresh token. */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (isLogoutInProgress()) return null;

  const storedRefresh = localStorage.getItem("refreshToken");
  if (!storedRefresh) return null;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshUrl = `${getPublicApiBaseUrl()}/auth/refresh-token`;
      const response = await axios.post(refreshUrl, {
        refreshToken: storedRefresh,
        accessToken: localStorage.getItem("token"),
      });
      const envelope = unwrapApiData<{
        accessToken: string;
        refreshToken: string;
      }>(response.data);
      applySessionTokens(envelope.accessToken, envelope.refreshToken);
      return envelope.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function clearSessionAndRedirectToLogin() {
  if (isLogoutInProgress()) return;
  beginLogout();
  clearAllClientSession();
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const returnUrl =
    path && path !== "/login" && !path.startsWith("/login")
      ? `?returnUrl=${encodeURIComponent(path)}`
      : "";
  window.location.href = `/login${returnUrl}`;
}

export function isSkippableAuthRetryUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("auth/login") ||
    url.includes("auth/register") ||
    url.includes("auth/verify-2fa") ||
    url.includes("auth/refresh-token")
  );
}
