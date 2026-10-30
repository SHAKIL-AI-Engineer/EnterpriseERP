"use client"

import { RouteGuard } from "@/components/auth/route-guard"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRoles={["SuperAdmin", "Admin", "Store", "StoreKeeper"]}>
      {children}
    </RouteGuard>
  )
}
