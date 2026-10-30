"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";

interface LeavePermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LeavePermissionGate({
  permission,
  children,
  fallback = null,
}: LeavePermissionGateProps) {
  const { hasPermission, hasRole } = useAuth();
  if (hasRole("SuperAdmin") || hasPermission(permission)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
