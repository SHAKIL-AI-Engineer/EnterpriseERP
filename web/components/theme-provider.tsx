"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeProviderProps = {
    children: React.ReactNode
    attribute?: "class" | `data-${string}`
    defaultTheme?: Theme
    enableSystem?: boolean
    enableColorScheme?: boolean
    disableTransitionOnChange?: boolean
    forcedTheme?: Theme
    storageKey?: string
    themes?: Theme[]
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: string) => void
    forcedTheme?: Theme
    resolvedTheme: ResolvedTheme
    themes: Theme[]
    systemTheme: ResolvedTheme
}

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined)

const DEFAULT_THEMES: Theme[] = ["light", "dark"]

function getSystemTheme(): ResolvedTheme {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function isTheme(value: string | null | undefined): value is Theme {
    return value === "light" || value === "dark" || value === "system"
}

function resolveTheme(
    theme: Theme,
    systemTheme: ResolvedTheme,
    enableSystem: boolean
): ResolvedTheme {
    if (theme === "light" || theme === "dark") return theme
    return enableSystem ? systemTheme : "light"
}

function disableTransitions() {
    const style = document.createElement("style")
    style.appendChild(
        document.createTextNode(
            "*,*::before,*::after{transition:none!important}"
        )
    )
    document.head.appendChild(style)

    return () => {
        window.getComputedStyle(document.body)
        setTimeout(() => document.head.removeChild(style), 1)
    }
}

export function ThemeProvider({
    children,
    attribute = "data-theme",
    defaultTheme = "system",
    enableSystem = true,
    enableColorScheme = true,
    disableTransitionOnChange = false,
    forcedTheme,
    storageKey = "theme",
    themes = DEFAULT_THEMES,
}: ThemeProviderProps) {
    const [theme, setThemeState] = React.useState<Theme>(() => {
        if (typeof window === "undefined") return defaultTheme

        try {
            const storedTheme = window.localStorage.getItem(storageKey)
            return isTheme(storedTheme) ? storedTheme : defaultTheme
        } catch {
            return defaultTheme
        }
    })
    const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(getSystemTheme)

    const activeTheme = forcedTheme ?? theme
    const resolvedTheme = resolveTheme(activeTheme, systemTheme, enableSystem)
    const themeList = React.useMemo<Theme[]>(
        () => (enableSystem ? [...themes, "system"] : themes),
        [enableSystem, themes]
    )

    const applyTheme = React.useCallback(
        (nextTheme: Theme, nextSystemTheme = getSystemTheme()) => {
            const root = document.documentElement
            const resolved = resolveTheme(nextTheme, nextSystemTheme, enableSystem)
            const restoreTransitions = disableTransitionOnChange
                ? disableTransitions()
                : undefined

            if (attribute === "class") {
                root.classList.remove("light", "dark")
                root.classList.add(resolved)
            } else {
                root.setAttribute(attribute, resolved)
            }

            if (enableColorScheme) {
                root.style.colorScheme = resolved
            }

            restoreTransitions?.()
        },
        [attribute, disableTransitionOnChange, enableColorScheme, enableSystem]
    )

    const setTheme = React.useCallback(
        (nextTheme: string) => {
            if (!isTheme(nextTheme)) return

            setThemeState(nextTheme)

            try {
                window.localStorage.setItem(storageKey, nextTheme)
            } catch {
                // Ignore storage failures in private browsing or locked-down contexts.
            }
        },
        [storageKey]
    )

    React.useEffect(() => {
        applyTheme(activeTheme, systemTheme)
    }, [activeTheme, applyTheme, systemTheme])

    React.useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = () => setSystemTheme(getSystemTheme())

        handleChange()
        media.addEventListener("change", handleChange)

        return () => media.removeEventListener("change", handleChange)
    }, [])

    React.useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== storageKey) return
            setThemeState(isTheme(event.newValue) ? event.newValue : defaultTheme)
        }

        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [defaultTheme, storageKey])

    const value = React.useMemo<ThemeProviderState>(
        () => ({
            theme,
            setTheme,
            forcedTheme,
            resolvedTheme,
            themes: themeList,
            systemTheme,
        }),
        [forcedTheme, resolvedTheme, setTheme, systemTheme, theme, themeList]
    )

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export function useTheme() {
    const context = React.useContext(ThemeProviderContext)

    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }

    return context
}
