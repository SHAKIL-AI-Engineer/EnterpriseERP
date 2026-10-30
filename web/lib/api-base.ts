/**
 * Browser-facing API base for Axios (`baseURL` + relative paths like `auth/login`).
 *
 * Set `NEXT_PUBLIC_API_URL` to the full API prefix including version, e.g.
 * `http://localhost:5000/api/v1` (trailing slash optional).
 *
 * If you only set the origin (e.g. `http://localhost:5000`), `/api/v1` is appended.
 */
export function getPublicApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1").replace(
    /\/+$/,
    "",
  );
  try {
    const u = new URL(raw);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "") {
      return `${u.origin}/api/v1`;
    }
    return raw;
  } catch {
    return raw.includes("/api") ? raw : `${raw}/api/v1`;
  }
}

/** Scheme + host (no path), for static assets and absolute links to the API host. */
export function getPublicApiOrigin(): string {
  try {
    return new URL(getPublicApiBaseUrl()).origin;
  } catch {
    const b = getPublicApiBaseUrl();
    return b.replace(/\/api\/v1.*$/i, "").replace(/\/api.*$/i, "").replace(/\/+$/, "") || b;
  }
}
