"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FullScreenLoading } from "@/components/loading-state"
import { authService } from "@/lib/services/auth"

interface RouteGuardProps {
    children: React.ReactNode
    requiredRoles?: string[]
    fallbackUrl?: string
}

export function RouteGuard({ children, requiredRoles = [], fallbackUrl = "/unauthorized" }: RouteGuardProps) {
    const { user, loading, isAuthenticated, hasAnyRole } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        if (!isAuthenticated || !user?.roles?.length) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
            router.replace(`/login?returnUrl=${returnUrl}`)
            return
        }

        if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
            router.replace(fallbackUrl)
        }
    }, [user, loading, isAuthenticated, hasAnyRole, requiredRoles, router, fallbackUrl])

    if (loading) {
        return <FullScreenLoading message="Verifying access..." />
    }

    if (!isAuthenticated || !user?.roles?.length) {
        if (authService.isAuthenticated()) {
            return <FullScreenLoading message="Verifying access..." />
        }
        return <FullScreenLoading message="Redirecting to login..." />
    }

    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        return <FullScreenLoading message="Access denied..." />
    }

    return <>{children}</>
}
