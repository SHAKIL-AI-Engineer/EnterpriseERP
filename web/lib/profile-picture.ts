import { getPublicApiOrigin } from "@/lib/api-base";

/** Resolve API-hosted profile picture path to a browser URL. */
export function resolveProfilePictureUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const origin = getPublicApiOrigin();
  return `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
