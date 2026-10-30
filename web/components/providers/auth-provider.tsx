"use client"

import * as React from "react"
import { authService, User, LoginResponse } from "@/lib/services/auth"
import { syncActiveCompanyStorage } from "@/lib/active-company-storage"
import { syncSessionCookieFromLocalStorage } from "@/lib/auth-cookie-sync"
import { establishAuthenticatedSession } from "@/lib/auth/establish-session"
import { extractRolesFromPayload, isAccessTokenValid, parseJwtPayload } from "@/lib/auth/jwt-claims"
import { useRouter, usePathname } from "next/navigation"
import { FullScreenLoading } from "@/components/loading-state"
import { beginLogout, performLogout } from "@/lib/logout"
import { getRedirectUrlForUser, resolveReturnUrl } from "@/lib/role-redirect"

interface LoginCredentials {
    username: string;
    password: string;
    rememberMe?: boolean;
}

interface AuthContextType {
    user: User | null
    loading: boolean
    /** True when a valid token and user with roles are present. */
    isAuthenticated: boolean
    login: (credentials: LoginCredentials) => Promise<LoginResponse>
    completeTwoFactorLogin: (pendingTwoFactorToken: string, code: string) => Promise<LoginResponse>
    logout: () => void
    hasRole: (role: string) => boolean
    hasPermission: (permission: string) => boolean
    hasAnyRole: (roles: string[]) => boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [initializing, setInitializing] = React.useState(true)
    const [loggingOut, setLoggingOut] = React.useState(false)
    const router = useRouter()
    const pathname = usePathname()

    React.useEffect(() => {
        const initAuth = async () => {
            if (typeof window === "undefined") {
                setLoading(false);
                setInitializing(false);
                return;
            }

            const sessionUser = await establishAuthenticatedSession();
            setUser(sessionUser);

            setLoading(false);
            setInitializing(false);
        };
        void initAuth();

        const handleProfileUpdate = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser(prev => prev ? ({ ...prev, ...parsed }) : parsed);
            }
        };

        window.addEventListener('profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('profile-updated', handleProfileUpdate);
    }, [])

    // Already signed in: leave /login (cookie + profile, or token restored from storage)
    React.useEffect(() => {
        if (loading || !user?.roles?.length) return
        if (pathname !== "/login" && !pathname?.startsWith("/login")) return
        const params = new URLSearchParams(window.location.search)
        router.replace(resolveReturnUrl(params.get("returnUrl"), user.roles))
    }, [user, loading, pathname, router])

    const finishSuccessfulLogin = async (response: LoginResponse) => {
        if (!response.success) return

        syncSessionCookieFromLocalStorage()
        setLoading(true)

        const sessionUser = await establishAuthenticatedSession().catch(() => null)
        const token = response.token || localStorage.getItem("token")
        const payload = token ? parseJwtPayload(token) : null
        const claimRoles = extractRolesFromPayload(payload ?? {})

        const roles = sessionUser?.roles?.length
            ? sessionUser.roles
            : (response.roles?.length ? response.roles : claimRoles)

        if (sessionUser) {
            setUser(sessionUser)
        } else if (roles.length) {
            setUser({
                id: payload?.sub as string ?? response.username,
                username: response.username,
                fullName: response.fullName || response.username,
                email: "",
                roles,
                permissions: response.permissions ?? [],
            } as User)
        } else {
            setUser(null)
            setLoading(false)
            return
        }

        setLoading(false)

        if (pathname === "/login" || pathname?.startsWith("/login")) {
            const params = new URLSearchParams(window.location.search)
            const target = resolveReturnUrl(params.get("returnUrl"), roles)
            router.replace(target)
            window.setTimeout(() => {
                if (window.location.pathname === "/login" || window.location.pathname.startsWith("/login")) {
                    window.location.assign(target)
                }
            }, 700)
        }
    }

    const login = async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials)
        await finishSuccessfulLogin(response)
        return response
    }

    const completeTwoFactorLogin = async (pendingTwoFactorToken: string, code: string) => {
        const response = await authService.verifyTwoFactorLogin(pendingTwoFactorToken, code)
        await finishSuccessfulLogin(response)
        return response
    }

    const logout = React.useCallback(() => {
        beginLogout()
        setLoggingOut(true)
        setUser(null)
        void performLogout()
    }, [])

    const isSuperAdmin = () => !!user?.roles?.includes("SuperAdmin")

    const hasRole = (role: string) => {
        if (!user || !user.roles) return false
        if (isSuperAdmin()) return true
        return user.roles.includes(role)
    }

    const hasAnyRole = (roles: string[]) => {
        if (!user || !user.roles) return false
        if (isSuperAdmin()) return true
        return roles.some(role => user.roles.includes(role))
    }

    const hasPermission = (permission: string) => {
        if (!user) return false
        if (isSuperAdmin()) return true
        return !!user.permissions?.includes(permission)
    }

    const isAuthenticated = React.useMemo(() => {
        if (!user?.roles?.length) return false
        const token =
            typeof window !== "undefined" ? localStorage.getItem("token") : null
        return isAccessTokenValid(token)
    }, [user])

    if (initializing) {
        return <FullScreenLoading message="Initializing your workspace..." />
    }

    if (loggingOut) {
        return <FullScreenLoading message="Signing out..." />
    }

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, completeTwoFactorLogin, logout, hasRole, hasPermission, hasAnyRole }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
