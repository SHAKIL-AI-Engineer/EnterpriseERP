"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRoles={["SuperAdmin", "Admin", "HR", "Management", "IT Officer", "HR Officer"]}>
      {children}
    </RouteGuard>
  )
}
