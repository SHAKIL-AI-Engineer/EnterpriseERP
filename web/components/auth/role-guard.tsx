"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { ReactNode } from "react"

interface RoleGuardProps {
    children: ReactNode
    roles?: string[]
    fallback?: ReactNode
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
    const { hasAnyRole, loading } = useAuth()

    if (loading) return null

    if (!roles || roles.length === 0) return <>{children}</>

    if (hasAnyRole(roles)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
