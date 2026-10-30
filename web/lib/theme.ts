export const THEME_COOKIE = "theme"

export type ThemePreference = "light" | "dark" | "system"

export function resolveThemeClass(
  preference: string | undefined,
  prefersDark: boolean
): "light" | "dark" {
  if (preference === "dark") return "dark"
  if (preference === "light") return "light"
  return prefersDark ? "dark" : "light"
}
