"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { canAccessRoute } from "@/lib/auth/access-config";
import { FullScreenLoading } from "@/components/loading-state";
export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user?.roles?.length) {
      const returnUrl = encodeURIComponent(pathname + (typeof window !== "undefined" ? window.location.search : ""));
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!canAccessRoute(pathname, user.roles, user.permissions ?? [])) {
      router.replace("/unauthorized");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <FullScreenLoading message="Verifying access..." />;
  }

  if (!isAuthenticated || !user?.roles?.length) {
    return <FullScreenLoading message="Redirecting to login..." />;
  }

  if (!canAccessRoute(pathname, user.roles, user.permissions ?? [])) {
    return <FullScreenLoading message="Access denied..." />;
  }

  return <>{children}</>;
}
