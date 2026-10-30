const COOKIE_MAX_AGE_SEC = 60 * 60 * 24;

/** Mirror `token` from localStorage into document.cookie for Next.js proxy (server cannot read localStorage). */
export function syncSessionCookieFromLocalStorage(): void {
  if (typeof document === "undefined") return;
  const token = localStorage.getItem("token");
  if (!token) return;

  const hasTokenCookie = document.cookie.split(";").some((part) => {
    const [name] = part.trim().split("=");
    return name === "token";
  });

  if (!hasTokenCookie) {
    document.cookie = `token=${token}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  }
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
}
