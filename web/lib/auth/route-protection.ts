export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/unauthorized",
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isProtectedPath(pathname: string): boolean {
  return !isPublicPath(pathname);
}

export function buildLoginRedirectUrl(
  pathname: string,
  search = "",
  origin = "",
): string {
  const returnPath =
    pathname && pathname !== "/" && pathname !== "/login"
      ? `${pathname}${search}`
      : "";
  const base = origin ? `${origin}/login` : "/login";
  if (!returnPath) return base;
  const params = new URLSearchParams({ returnUrl: returnPath });
  return `${base}?${params.toString()}`;
}
