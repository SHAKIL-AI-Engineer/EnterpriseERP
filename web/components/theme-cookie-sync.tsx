"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { THEME_COOKIE } from "@/lib/theme"

/** Keeps the theme cookie in sync with localStorage for SSR class on `<html>`. */
export function ThemeCookieSync() {
  const { theme } = useTheme()

  useEffect(() => {
    if (!theme) return
    document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`
  }, [theme])

  return null
}
