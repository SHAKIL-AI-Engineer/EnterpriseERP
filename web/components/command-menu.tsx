"use client"

import * as React from "react"
import {
    IconCalculator,
    IconCalendar,
    IconCreditCard,
    IconSettings,
    IconMoodSmile,
    IconUser,
    IconLayoutDashboard,
    IconUsers,
    IconReceipt,
    IconBuildingFactory2,
    IconPackages,
    IconScissors,
    IconHistory,
    IconTerminal2
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useSearch } from "@/components/search-context"
import { sidebarData } from "./layout/data/sidebar-data"
import { useAuth } from "@/components/providers/auth-provider"
import { usePathname } from "next/navigation"

type SearchItem = {
    title: string
    url: string
    icon: React.ElementType
    category: string
    moduleName: string
}

export function CommandMenu() {
    const router = useRouter()
    const { open, setOpen } = useSearch()
    const { hasAnyRole } = useAuth()
    const pathname = usePathname()
    const [recentSearches, setRecentSearches] = React.useState<SearchItem[]>([])

    // Detect current module based on URL
    const currentModuleName = React.useMemo(() => {
        const firstSegment = pathname.split('/')[1]
        const found = sidebarData.modules.find(m =>
            m.name.toLowerCase() === firstSegment ||
            m.navMain.some(n => n.url.startsWith(`/${firstSegment}`))
        )
        return found?.name || "Global"
    }, [pathname])

    // Load recent searches from localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem("recent-searches")
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved).slice(0, 5))
            } catch (e) {
                console.error("Failed to parse recent searches")
            }
        }
    }, [open])

    const runCommand = React.useCallback((item: Omit<SearchItem, "icon"> & { icon?: React.ElementType }) => {
        setOpen(false)

        const newRecent = [
            { title: item.title, url: item.url, category: item.category, moduleName: item.moduleName },
            ...recentSearches.filter((i) => i.url !== item.url)
        ].slice(0, 5)

        localStorage.setItem("recent-searches", JSON.stringify(newRecent))
        setRecentSearches(newRecent as any)

        router.push(item.url)
    }, [setOpen, recentSearches, router])

    // Flatten sidebar data into searchable items
    const searchableItems = React.useMemo(() => {
        const items: SearchItem[] = []

        sidebarData.modules.forEach(module => {
            const moduleRoles = (module as any).roles as string[] | undefined
            if (moduleRoles && !hasAnyRole(moduleRoles)) return

            module.navMain.forEach(nav => {
                items.push({
                    title: nav.title,
                    url: nav.url,
                    icon: nav.icon,
                    category: module.name,
                    moduleName: module.name
                })
            })

            module.navGroup.forEach(group => {
                const groupRoles = (group as any).roles as string[] | undefined
                if (groupRoles && !hasAnyRole(groupRoles)) return

                group.items?.forEach(subItem => {
                    const itemRoles = (subItem as any).roles as string[] | undefined
                    if (itemRoles && !hasAnyRole(itemRoles)) return

                    items.push({
                        title: subItem.title,
                        url: subItem.url,
                        icon: group.icon || IconTerminal2,
                        category: group.title,
                        moduleName: module.name
                    })
                })
            })
        })

        sidebarData.navSecondary.forEach(nav => {
            items.push({
                title: nav.title,
                url: nav.url,
                icon: nav.icon,
                category: "System",
                moduleName: "System"
            })
        })

        return items
    }, [hasAnyRole])

    // Group items by category for the UI
    const filteredCategories = React.useMemo(() => {
        const groups: Record<string, SearchItem[]> = {}

        // Filter: only show items from current module by default
        // If "Global" is the current context, show all
        const isGlobal = currentModuleName === "Global"

        const relevantItems = isGlobal
            ? searchableItems
            : searchableItems.filter(item => item.moduleName === currentModuleName)

        relevantItems.forEach(item => {
            const key = isGlobal ? `${item.moduleName} > ${item.category}` : item.category
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        })

        return groups
    }, [searchableItems, currentModuleName])

    // Other items for global search fallback
    const otherItems = React.useMemo(() => {
        if (currentModuleName === "Global") return []
        return searchableItems.filter(item => item.moduleName !== currentModuleName)
    }, [searchableItems, currentModuleName])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <div className="flex flex-col">
                <div className="px-4 py-3 border-b bg-muted/30">
                    <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center gap-2">
                        <IconTerminal2 className="size-3" />
                        Active Context: <span className="text-primary">{currentModuleName} Module</span>
                    </p>
                </div>
                <CommandInput placeholder={`Search within ${currentModuleName}...`} />
            </div>
            <CommandList className="max-h-[450px]">
                <CommandEmpty className="py-10 text-center">
                    <p className="text-sm font-medium">No results found in {currentModuleName}.</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching globally or different keywords.</p>
                </CommandEmpty>

                {recentSearches.length > 0 && (
                    <>
                        <CommandGroup heading="Recent Activity">
                            {recentSearches.map((item) => (
                                <CommandItem
                                    key={`recent-${item.url}`}
                                    onSelect={() => runCommand(item)}
                                >
                                    <IconHistory className="mr-3 h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.title}</span>
                                        <span className="text-[10px] text-muted-foreground opacity-70">
                                            {item.moduleName} &gt; {item.category}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {Object.entries(filteredCategories).map(([category, items]) => (
                    <CommandGroup key={category} heading={category}>
                        {items.map((item, index) => (
                            <CommandItem
                                key={`${item.url}-${index}`}
                                onSelect={() => runCommand(item)}
                                className="py-2.5"
                            >
                                <div className={`mr-3 flex h-7 w-7 items-center justify-center rounded-lg border bg-background/50 text-muted-foreground group-aria-selected:border-primary group-aria-selected:text-primary transition-colors`}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{item.title}</span>
                                    {currentModuleName === "Global" && (
                                        <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">{item.moduleName}</span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}

                {otherItems.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Global Search Results">
                            {otherItems.slice(0, 10).map((item, index) => (
                                <CommandItem
                                    key={`global-${item.url}-${index}`}
                                    onSelect={() => runCommand(item)}
                                    className="opacity-60 hover:opacity-100"
                                >
                                    <item.icon className="mr-3 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{item.title}</span>
                                        <span className="text-[10px] text-muted-foreground">in {item.moduleName}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                <CommandSeparator />
                <CommandGroup heading="Quick Configuration">
                    <CommandItem onSelect={() => { router.push("/settings"); setOpen(false); }}>
                        <IconSettings className="mr-3 h-4 w-4" />
                        <span>System Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
