import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessRoute, findMatchingRouteRule } from "@/lib/auth/access-config";
import {
  extractPermissionsFromPayload,
  extractRolesFromPayload,
  isAccessTokenValid,
  parseJwtPayload,
} from "@/lib/auth/jwt-claims";
import { isPublicPath } from "@/lib/auth/route-protection";
import { getRedirectUrlForUser } from "@/lib/role-redirect";

function loginRedirect(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/" && pathname !== "/login") {
    url.searchParams.set("returnUrl", `${pathname}${search}`);
  }
  const response = NextResponse.redirect(url);
  response.cookies.delete("token");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const publicRoute = isPublicPath(pathname);

  if (token && publicRoute) {
    if (!isAccessTokenValid(token)) {
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }

    const payload = parseJwtPayload(token);
    if (payload) {
      const roles = extractRolesFromPayload(payload);
      if (roles.length > 0) {
        const returnUrl = request.nextUrl.searchParams.get("returnUrl");
        const target =
          returnUrl &&
          returnUrl.startsWith("/") &&
          !returnUrl.startsWith("//") &&
          !returnUrl.startsWith("/login")
            ? returnUrl
            : getRedirectUrlForUser(roles);
        return NextResponse.redirect(new URL(target, request.url));
      }
    }
    const response = NextResponse.next();
    response.cookies.delete("token");
    return response;
  }

  if (!publicRoute) {
    if (!token || !isAccessTokenValid(token)) {
      return loginRedirect(request);
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      return loginRedirect(request);
    }

    const roles = extractRolesFromPayload(payload);
    const permissions = extractPermissionsFromPayload(payload);

    if (roles.length === 0) {
      return loginRedirect(request);
    }

    const rule = findMatchingRouteRule(pathname);
    if (rule && !canAccessRoute(pathname, roles, permissions)) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
