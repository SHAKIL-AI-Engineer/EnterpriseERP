import api from "../api";
import { unwrapApiData, firstApiErrorMessage } from "@/lib/api-response";
import { resolveCompanyGuid, isValidCompanyGuid } from "@/lib/company-id";
import {
  syncActiveCompanyStorage,
  clearActiveCompanyStorage,
} from "@/lib/active-company-storage";
import { clearSessionCookie, syncSessionCookieFromLocalStorage } from "@/lib/auth-cookie-sync";
import { clearLogoutFlag } from "@/lib/logout";
import type { Company } from "@/lib/services/company";

/** Auth API + HR gateway use camelCase envelopes. */
interface LoginEnvelope {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  requiresTwoFactor: boolean;
  pendingTwoFactorToken?: string | null;
}

interface UserProfileEnvelope {
  userId: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  fullName: string;
  profilePictureUrl?: string | null;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  isActive: boolean;
  status: number;
  isLocked: boolean;
  lastLoginAt?: string | null;
  twoFactorEnabled: boolean;
  roles: string[];
  permissions: string[];
  companyAccess: Array<{ id: string; companyId: string; isDefaultCompany: boolean }>;
  tenantScope?: string;
  defaultCompanyId?: string | null;
}

interface UserListItemEnvelope {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber?: string | null;
  status: number;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: string | null;
  roles?: string[];
  companyAccess?: Array<{ id: string; companyId: string; isDefaultCompany: boolean }>;
}
export interface LoginResponse {
  token: string;
  refreshToken: string;
  success: boolean;
  message: string;
  username: string;
  fullName: string;
  roles: string[];
  permissions?: string[];
  requiresTwoFactor?: boolean;
  pendingTwoFactorToken?: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  country?: string;
  city?: string;
  bio?: string;
  isActive: boolean;
  status?: number;
  isLocked?: boolean;
  lastLoginAt?: string | null;
  twoFactorEnabled?: boolean;
  roles: string[];
  /** Populated from `auth/me` when available */
  permissions?: string[];
  assignedCompanyIds?: string[];
  defaultCompanyId?: string | null;
  tenantScope?: string;
}

export interface RoleDetails {
  id: string;
  name: string;
  userCount: number;
  permissions?: string[];
}

export interface PermissionDto {
  roleName: string;
  permissions: string[];
}

export interface AuthPermissionItem {
  id: string;
  code: string;
  description: string;
}

export interface UpdatePermissionDto {
  roleId: string;
  permissions: string[];
}

export interface UserCompanyAccess {
  id: string;
  companyId: string;
  isDefaultCompany: boolean;
}

export interface UserLoginHistory {
  id: string;
  ipAddress?: string | null;
  macAddress?: string | null;
  deviceName?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  isSuccess: boolean;
  failureReason?: string | null;
  loginAt: string;
}

export interface TwoFactorSetupResponse {
  sharedKey: string;
  otpAuthUri: string;
}

export interface TwoFactorVerifyResponse {
  recoveryCodes: string[];
}

export interface UserProfileUpdateDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

function storeSessionFromLogin(data: LoginEnvelope) {
  clearLogoutFlag();
  const token = data.accessToken;
  localStorage.setItem("token", token);
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
  localStorage.setItem("refreshToken", data.refreshToken);
  const isSuperAdmin = data.roles?.includes("SuperAdmin") ?? false;
  localStorage.setItem(
    "user",
    JSON.stringify({
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      id: data.userId,
      roles: data.roles,
      permissions: data.permissions ?? [],
    }),
  );
  syncActiveCompanyStorage({
    allowedCompanyIds: [],
    isSuperAdmin,
    accessToken: token,
  });
}

function persistUserSession(profile: User) {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem("user");
  let parsed: Record<string, unknown> = {};
  if (existing) {
    try {
      parsed = JSON.parse(existing) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }
  localStorage.setItem(
    "user",
    JSON.stringify({
      ...parsed,
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      email: profile.email,
      profilePictureUrl: profile.profilePictureUrl ?? null,
    }),
  );
  window.dispatchEvent(new Event("profile-updated"));
}

function mapProfileToUser(p: UserProfileEnvelope): User {
  const assignedCompanyIds = p.companyAccess
    .map((c) => String(c.companyId))
    .filter((id) => isValidCompanyGuid(id));
  const defaultCompanyId =
    p.defaultCompanyId?.toString() ??
    p.companyAccess.find((c) => c.isDefaultCompany)?.companyId?.toString() ??
    null;
  const user: User = {
    id: p.userId,
    username: p.username,
    email: p.email,
    fullName: p.fullName,
    phoneNumber: p.phoneNumber ?? undefined,
    profilePictureUrl: p.profilePictureUrl ?? undefined,
    country: p.country ?? undefined,
    city: p.city ?? undefined,
    bio: p.bio ?? undefined,
    isActive: p.isActive,
    status: p.status,
    isLocked: p.isLocked,
    lastLoginAt: p.lastLoginAt,
    twoFactorEnabled: p.twoFactorEnabled,
    roles: [...p.roles],
    permissions: [...p.permissions],
    assignedCompanyIds,
    defaultCompanyId,
    tenantScope: p.tenantScope,
  };
  syncActiveCompanyStorage({
    allowedCompanyIds: assignedCompanyIds,
    defaultCompanyId,
    isSuperAdmin: p.roles.includes("SuperAdmin"),
    accessToken:
      typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined,
  });
  return user;
}

function mapListItemToUser(row: UserListItemEnvelope): User {
  return {
    id: row.id,
    username: row.userName,
    email: row.email,
    fullName: row.fullName,
    phoneNumber: row.phoneNumber ?? undefined,
    isActive: row.isActive,
    status: typeof row.status === "string" ? ({ Pending: 0, Active: 1, Inactive: 2, Suspended: 3 }[row.status] ?? 2) : row.status,
    isLocked: row.isLocked,
    lastLoginAt: row.lastLoginAt,
    roles: [...(row.roles ?? [])],
    assignedCompanyIds: (row.companyAccess ?? [])
      .map((c) => String(c.companyId))
      .filter((id) => isValidCompanyGuid(id)),
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // A forced sign-out must not prevent a subsequent explicit sign-in.
    clearLogoutFlag();
    try {
      const res = await api.post("auth/login", {
        username: credentials.username,
        password: credentials.password,
      });
      const data = unwrapApiData<LoginEnvelope>(res.data);
      if (data.requiresTwoFactor) {
        return {
          success: false,
          message: "Two-factor authentication code is required.",
          token: "",
          refreshToken: "",
          username: data.username,
          fullName: data.fullName,
          roles: data.roles ?? [],
          requiresTwoFactor: true,
          pendingTwoFactorToken: data.pendingTwoFactorToken,
        };
      }
      storeSessionFromLogin(data);
      return {
        success: true,
        message: "Signed in successfully.",
        token: data.accessToken,
        refreshToken: data.refreshToken,
        username: data.username,
        fullName: data.fullName,
        roles: [...data.roles],
        permissions: [...(data.permissions ?? [])],
        requiresTwoFactor: false,
        pendingTwoFactorToken: null,
      };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      const msg =
        firstApiErrorMessage(ax.response?.data) ||
        ax.message ||
        "Invalid username or password.";
      return {
        success: false,
        message: msg,
        token: "",
        refreshToken: "",
        username: "",
        fullName: "",
        roles: [],
        requiresTwoFactor: false,
        pendingTwoFactorToken: null,
      };
    }
  },

  async verifyTwoFactorLogin(
    pendingTwoFactorToken: string,
    code: string,
  ): Promise<LoginResponse> {
    try {
      const res = await api.post("auth/verify-2fa", {
        pendingTwoFactorToken,
        code,
      });
      const data = unwrapApiData<LoginEnvelope>(res.data);
      storeSessionFromLogin(data);
      return {
        success: true,
        message: "Signed in successfully.",
        token: data.accessToken,
        refreshToken: data.refreshToken,
        username: data.username,
        fullName: data.fullName,
        roles: [...data.roles],
        permissions: [...(data.permissions ?? [])],
        requiresTwoFactor: false,
        pendingTwoFactorToken: null,
      };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Two-factor verification failed.",
        token: "",
        refreshToken: "",
        username: "",
        fullName: "",
        roles: [],
        requiresTwoFactor: true,
        pendingTwoFactorToken,
      };
    }
  },
  async getUsers(): Promise<User[]> {
    const res = await api.get("users");
    const rows = unwrapApiData<UserListItemEnvelope[]>(res.data);
    return rows.map(mapListItemToUser);
  },

  async createUser(
    userData: Partial<User> & {
      password: string;
      username: string;
      email: string;
      role?: string;
      fullName?: string;
      companyIds?: Array<string | number>;
      companies?: Company[];
    },
  ): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const reg = await api.post("users", {
        username: userData.username, email: userData.email, password: userData.password,
        fullName: userData.fullName || userData.username,
        roleNames: userData.role ? [userData.role] : [],
        companyIds: (userData.companyIds ?? []).map(id => resolveCompanyGuid(id, userData.companies)).filter(Boolean),
      });
      const created = unwrapApiData<{ userId: string }>(reg.data);
      return { success: true, message: "Account awaiting approval by another administrator.", userId: created.userId };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Create user failed.",
      };
    }
  },

  async getRoles(): Promise<RoleDetails[]> {
    const res = await api.get("roles");
    const items = unwrapApiData<Array<{ id: string; name: string; userCount?: number; permissions?: string[] }>>(res.data);
    return items.map((r) => ({
      id: r.id,
      name: r.name,
      userCount: r.userCount ?? 0,
      permissions: [...(r.permissions ?? [])],
    }));
  },

  async createRole(roleName: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.post("roles", { name: roleName });
      return { success: true, message: "Role created." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Create role failed.",
      };
    }
  },

  async assignRole(
    userId: string,
    roleName: string,
    currentRoles: string[],
  ): Promise<{ success: boolean; message: string }> {
    const next = Array.from(new Set([...currentRoles, roleName]));
    return authService.replaceUserRoles(userId, next);
  },

  async removeRole(
    userId: string,
    roleName: string,
    currentRoles: string[],
  ): Promise<{ success: boolean; message: string }> {
    const next = currentRoles.filter((r) => r !== roleName);
    return authService.replaceUserRoles(userId, next);
  },

  async replaceUserRoles(
    userId: string,
    roleNames: string[],
  ): Promise<{ success: boolean; message: string }> {
    try {
      await api.post(`users/${userId}/roles`, { roleNames });
      return { success: true, message: "Roles updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Role update failed.",
      };
    }
  },

  async getAllPermissions(): Promise<string[]> {
    const res = await api.get("permissions");
    const items = unwrapApiData<AuthPermissionItem[]>(res.data);
    return items.map((p) => p.code);
  },

  async getAllPermissionDetails(): Promise<AuthPermissionItem[]> {
    const res = await api.get("permissions");
    return unwrapApiData<AuthPermissionItem[]>(res.data);
  },

  async getRolePermissions(roleName: string): Promise<PermissionDto> {
    const roles = await authService.getRoles();
    const role = roles.find((r) => r.name === roleName);
    return { roleName, permissions: role?.permissions ?? [] };
  },

  async updateRolePermissions(data: UpdatePermissionDto): Promise<{ success: boolean; message: string }> {
    try {
      await api.post(`roles/${data.roleId}/permissions`, {
        permissionCodes: data.permissions,
      });
      return { success: true, message: "Permissions updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Permission update failed.",
      };
    }
  },

  async updateUser(
    userId: string,
    data: Partial<User> & { isActive?: boolean; fullName?: string; email?: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      await api.patch(`users/${userId}`, { fullName: data.fullName, email: data.email, isActive: data.isActive });
      return { success: true, message: "User updated." };
    } catch (e: unknown) {
      const error = e as { response?: { data?: unknown }; message?: string };
      return { success: false, message: firstApiErrorMessage(error.response?.data) || error.message || "Update failed." };
    }
  },

  async updateUserStatus(
    userId: string,
    body: { status: number; isActive: boolean },
  ): Promise<{ success: boolean; message: string }> {
    try {
      await api.put(`users/${userId}/status`, body);
      return { success: true, message: "User updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Update failed.",
      };
    }
  },

  async setUserCompanies(
    userId: string,
    companyIds: Array<string | number>,
    companies?: Company[],
  ): Promise<{ success: boolean; message: string }> {
    try {
      const resolved = companyIds
        .map((id) => resolveCompanyGuid(id, companies))
        .filter((id): id is string => !!id);

      const unique = [...new Set(resolved)];
      if (unique.length === 0) {
        return { success: false, message: "Select at least one valid company." };
      }

      const items = unique.map((companyId, index) => ({
        companyId,
        isDefaultCompany: index === 0,
      }));

      await api.post(`users/${encodeURIComponent(userId)}/companies`, { items });
      return { success: true, message: "Company access updated." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Company access update failed.",
      };
    }
  },

  async getUserCompanies(userId: string): Promise<UserCompanyAccess[]> {
    const res = await api.get(`users/${userId}/companies`);
    return unwrapApiData<UserCompanyAccess[]>(res.data);
  },

  async getMyCompanies(): Promise<UserCompanyAccess[]> {
    const res = await api.get("auth/me/companies");
    return unwrapApiData<UserCompanyAccess[]>(res.data);
  },

  async getUserLoginHistory(userId: string): Promise<UserLoginHistory[]> {
    const res = await api.get(`users/${userId}/login-history`);
    return unwrapApiData<UserLoginHistory[]>(res.data);
  },

  async updateProfile(data: UserProfileUpdateDto): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await api.put("auth/me/profile", data);
      const p = unwrapApiData<UserProfileEnvelope>(res.data);
      const user = mapProfileToUser(p);
      persistUserSession(user);
      return { success: true, message: "Profile updated.", user };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to update profile.",
      };
    }
  },

  async uploadProfilePicture(file: File): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("auth/me/profile-picture", form);
      const p = unwrapApiData<UserProfileEnvelope>(res.data);
      const user = mapProfileToUser(p);
      persistUserSession(user);
      return { success: true, message: "Profile picture updated.", user };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to upload profile picture.",
      };
    }
  },

  async removeProfilePicture(): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await api.delete("auth/me/profile-picture");
      const p = unwrapApiData<UserProfileEnvelope>(res.data);
      const user = mapProfileToUser(p);
      persistUserSession(user);
      return { success: true, message: "Profile picture removed.", user };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to remove profile picture.",
      };
    }
  },

  async getProfile(): Promise<User> {
    const res = await api.get("auth/me");
    const p = unwrapApiData<UserProfileEnvelope>(res.data);
    const user = mapProfileToUser(p);
    persistUserSession(user);
    return user;
  },

  async enableTwoFactor(): Promise<TwoFactorSetupResponse> {
    const res = await api.post("auth/enable-2fa");
    return unwrapApiData<TwoFactorSetupResponse>(res.data);
  },

  async verifyTwoFactorSetup(code: string): Promise<TwoFactorVerifyResponse> {
    const res = await api.post("auth/verify-2fa", { code });
    return unwrapApiData<TwoFactorVerifyResponse>(res.data);
  },

  async disableTwoFactor(password: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.post("auth/disable-2fa", { password, code });
      return { success: true, message: "Two-factor authentication disabled." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Disable two-factor authentication failed.",
      };
    }
  },

  async changePassword(data: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    try {
      await api.put("auth/me/password", data);
      return { success: true, message: "Password changed successfully." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to change password.",
      };
    }
  },

  async changeUserPassword(userId: string, data: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put(`users/${encodeURIComponent(userId)}/password`, data);
      const result = unwrapApiData<{ message: string }>(response.data);
      return { success: true, message: result.message };
    } catch (e: unknown) {
      const error = e as { response?: { data?: unknown }; message?: string };
      return { success: false, message: firstApiErrorMessage(error.response?.data) || error.message || "Failed to change password." };
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try { await api.delete(`users/${userId}`); return { success: true, message: "Account removed; history retained." }; }
    catch (e: unknown) { const error = e as { response?: { data?: unknown }; message?: string };
      return { success: false, message: firstApiErrorMessage(error.response?.data) || error.message || "Delete failed." }; }
  },

  logout: async () => {
    const { performLogout } = await import("@/lib/logout");
    await performLogout();
  },

  getCurrentUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },
};
