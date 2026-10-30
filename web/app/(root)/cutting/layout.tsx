"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function CuttingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRoles={["SuperAdmin", "Admin", "Cutting"]}>
      {children}
    </RouteGuard>
  )
}
