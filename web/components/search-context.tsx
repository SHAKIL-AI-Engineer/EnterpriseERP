"use client"

import * as React from "react"

interface SearchContextType {
    open: boolean
    setOpen: (open: boolean) => void
    toggle: () => void
}

const SearchContext = React.createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)

    const toggle = React.useCallback(() => {
        setOpen((prev) => !prev)
    }, [])

    // Keyboard shortcut to toggle search
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <SearchContext.Provider value={{ open, setOpen, toggle }}>
            {children}
        </SearchContext.Provider>
    )
}

export function useSearch() {
    const context = React.useContext(SearchContext)
    if (!context) {
        throw new Error("useSearch must be used within a SearchProvider")
    }
    return context
}
