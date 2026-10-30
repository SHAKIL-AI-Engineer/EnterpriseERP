"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { FullScreenLoading } from "@/components/loading-state";
import { canAccessRoute } from "@/lib/auth/access-config";
import { isPublicPath } from "@/lib/auth/route-protection";
import { getRedirectUrlForUser } from "@/lib/role-redirect";
import { authService } from "@/lib/services/auth";

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoute = isPublicPath(pathname);

  useEffect(() => {
    if (loading || publicRoute) return;

    if (!isAuthenticated || !user?.roles?.length) {
      const returnUrl = encodeURIComponent(
        pathname + (typeof window !== "undefined" ? window.location.search : ""),
      );
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!canAccessRoute(pathname, user.roles, user.permissions ?? [])) {
      router.replace("/unauthorized");
      return;
    }

    if (pathname === "/" || pathname === "") {
      const userHomePath = getRedirectUrlForUser(user.roles);
      const managementRoles = [
        "HR",
        "Management",
        "HR Officer",
        "IT Officer",
        "SuperAdmin",
        "Admin",
      ];
      const isManagementUser = user.roles.some((role) =>
        managementRoles.includes(role),
      );

      if (!isManagementUser && userHomePath !== "/") {
        router.replace(userHomePath);
      }
    }
  }, [user, loading, isAuthenticated, pathname, router, publicRoute]);

  if (publicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return <FullScreenLoading message="Verifying your session..." />;
  }

  if (!isAuthenticated || !user?.roles?.length) {
    if (authService.isAuthenticated()) {
      return <FullScreenLoading message="Verifying your session..." />;
    }
    return <FullScreenLoading message="Redirecting to login..." />;
  }

  if (!canAccessRoute(pathname, user.roles, user.permissions ?? [])) {
    return <FullScreenLoading message="Access denied..." />;
  }

  return <>{children}</>;
}
