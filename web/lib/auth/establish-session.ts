import { syncActiveCompanyStorage } from "@/lib/active-company-storage";
import { syncSessionCookieFromLocalStorage } from "@/lib/auth-cookie-sync";
import {
  isAccessTokenValid,
  parseJwtPayload,
} from "@/lib/auth/jwt-claims";
import { refreshAccessToken } from "@/lib/auth-session";
import { clearAllClientSession } from "@/lib/logout";
import { authService, type User } from "@/lib/services/auth";

function persistProfileUser(profile: User): void {
  syncActiveCompanyStorage({
    allowedCompanyIds: profile.assignedCompanyIds ?? [],
    defaultCompanyId: profile.defaultCompanyId ?? null,
    isSuperAdmin: profile.roles.includes("SuperAdmin"),
    accessToken: localStorage.getItem("token") ?? undefined,
  });
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      email: profile.email,
      roles: profile.roles,
      permissions: profile.permissions ?? [],
      profilePictureUrl: profile.profilePictureUrl ?? null,
    }),
  );
}

function hydrateUserFromStorage(): User | null {
  const stored = authService.getCurrentUser() as User | null;
  if (!stored?.roles?.length) return null;
  return {
    id: stored.id ?? "",
    username: stored.username ?? "",
    email: stored.email ?? "",
    fullName: stored.fullName ?? stored.username ?? "",
    roles: stored.roles,
    permissions: stored.permissions ?? [],
    isActive: true,
    profilePictureUrl: stored.profilePictureUrl ?? undefined,
  };
}

/**
 * Validates access/refresh tokens, refreshes when needed, loads profile with roles.
 * Returns null and clears client session when the user cannot be authenticated.
 */
export async function establishAuthenticatedSession(): Promise<User | null> {
  if (typeof window === "undefined") return null;

  syncSessionCookieFromLocalStorage();

  let accessToken = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!accessToken && !refreshToken) {
    clearAllClientSession();
    return null;
  }

  if (!isAccessTokenValid(accessToken) && refreshToken) {
    accessToken = await refreshAccessToken();
  }

  if (!isAccessTokenValid(accessToken)) {
    clearAllClientSession();
    return null;
  }

  const loadProfile = async (): Promise<User | null> => {
    const profile = await authService.getProfile();
    if (!profile?.roles?.length) {
      return null;
    }
    persistProfileUser(profile);
    return profile;
  };

  try {
    return await loadProfile();
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;

    if (status === 401 && refreshToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        syncSessionCookieFromLocalStorage();
        try {
          return await loadProfile();
        } catch (retryError) {
          const retryStatus = (retryError as { response?: { status?: number } })
            ?.response?.status;
          if (retryStatus === 401) {
            clearAllClientSession();
            return null;
          }
        }
      }
      clearAllClientSession();
      return null;
    }

    if (status === 401) {
      clearAllClientSession();
      return null;
    }

    const payload = accessToken ? parseJwtPayload(accessToken) : null;
    if (payload && isAccessTokenValid(accessToken)) {
      return hydrateUserFromStorage();
    }

    return null;
  }
}
