"use client"

import * as React from "react"
import { IconSearch, IconSelector } from "@tabler/icons-react"
import { usePathname, useRouter } from "next/navigation"
import { NavGroup } from "./nav-group"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { sidebarData } from "./data/sidebar-data"
import { canAccessRoute } from "@/lib/auth/access-config"

import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, AvatarImage } from "../ui/avatar"

function getSelectedModuleName(pathname: string, modules: any[]): string {
  const currentPathModule = modules.find((module) => {
    const inNavMain = module.navMain?.some(
      (item: any) =>
        pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/"))
    )
    if (inNavMain) return true

    const inNavGroup = module.navGroup?.some((group: any) =>
      group.items?.some(
        (item: any) => pathname === item.url || pathname.startsWith(item.url + "/")
      )
    )
    return inNavGroup
  })

  return currentPathModule?.name ?? ""
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasAnyRole, user, loading } = useAuth()

  // Filter modules based on user roles
  const accessibleModules = React.useMemo(() => {
    // Don't show any modules if still loading or no user data
    if (loading || !user || !user.roles || user.roles.length === 0) {
      return []
    }

    return sidebarData.modules.filter(module => {
      const accessPath = (module as { accessPath?: string }).accessPath
      if (accessPath) {
        return canAccessRoute(accessPath, user.roles, user.permissions ?? [])
      }

      const requiredRoles = (module as { roles?: string[] }).roles
      if (!requiredRoles || requiredRoles.length === 0) return true
      return hasAnyRole(requiredRoles)
    })
  }, [hasAnyRole, user, loading])

  // Find the initial active module based on the current URL
  const initialModule = React.useMemo(() => {
    // If no modules accessible yet, return first from safely or empty
    const modulesToSearch = accessibleModules.length > 0 ? accessibleModules : sidebarData.modules

    const foundModule = modulesToSearch.find(module => {
      // Check navMain
      const inNavMain = module.navMain.some(item => pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url)))
      if (inNavMain) return true

      // Check navGroup
      const inNavGroup = module.navGroup.some(group =>
        group.items?.some(item => pathname === item.url || pathname.startsWith(item.url))
      )
      return inNavGroup
    })
    return foundModule || modulesToSearch[0]
  }, [pathname, accessibleModules])

  const [activeModule, setActiveModule] = React.useState(initialModule)
  const [searchQuery, setSearchQuery] = React.useState("")
  const { isMobile, setOpenMobile } = useSidebar()

  // Update active module ONLY when pathname changes
  React.useEffect(() => {
    const modulesToSearch = accessibleModules.length > 0 ? accessibleModules : sidebarData.modules

    const currentPathModule = modulesToSearch.find(module => {
      // Check navMain
      const inNavMain = module.navMain.some(item =>
        pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/"))
      )
      if (inNavMain) return true

      // Check navGroup
      const inNavGroup = module.navGroup.some(group =>
        group.items?.some(item =>
          pathname === item.url || pathname.startsWith(item.url + "/")
        )
      )
      return inNavGroup
    })

    if (currentPathModule) {
      setActiveModule(currentPathModule)
    }
  }, [pathname, accessibleModules])

  const filterNavGroup = (items: any[]) => {
    // 1. Filter by Roles first
    const roleFilteredItems = items.filter(item => {
      const requiredRoles = item.roles as string[] | undefined
      if (!requiredRoles || requiredRoles.length === 0) return true
      return hasAnyRole(requiredRoles)
    }).map(item => ({
      ...item,
      items: item.items?.filter((child: any) => {
        const requiredRoles = child.roles as string[] | undefined
        return (!requiredRoles?.length || hasAnyRole(requiredRoles)) &&
          canAccessRoute(child.url, user?.roles ?? [], user?.permissions ?? [])
      }),
    })).filter(item => !item.items || item.items.length > 0)

    if (!searchQuery) return roleFilteredItems

    return roleFilteredItems
      .map((item) => {
        const matchesTitle = item.title.toLowerCase().includes(searchQuery.toLowerCase())
        let filteredChildren: any[] = []

        if (item.items) {
          filteredChildren = item.items.filter((child: any) =>
            child.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        if (matchesTitle) {
          return { ...item, isActive: true }
        }

        if (filteredChildren && filteredChildren.length > 0) {
          return { ...item, items: filteredChildren, isActive: true }
        }

        return null
      })
      .filter((item) => item !== null)
  }

  const filterNavItems = (items: any[]) => {
    if (!searchQuery) return items
    return items.filter((item: any) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const filteredNavMain = activeModule ? filterNavItems(activeModule.navMain) : []
  const filteredNavGroup = activeModule ? filterNavGroup(activeModule.navGroup) : []
  const filteredNavSecondary = filterNavItems(sidebarData.navSecondary)

  // Show empty sidebar while loading or if no modules accessible
  if (loading || !user || !user.roles || accessibleModules.length === 0 || !activeModule) {
    return <Sidebar {...props} />
  }

  const selectedModuleName = getSelectedModuleName(pathname, accessibleModules) || activeModule.name

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Show module switcher only if user has access to multiple modules */}
            {accessibleModules.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent">
                      <Avatar >
                        <AvatarImage src="https://github.com/shadcn.png" alt="HR Hub Logo" />
                      </Avatar>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold uppercase tracking-wider text-sidebar-foreground dark:text-white">
                        HR Hub
                      </span>
                      <span className="truncate text-xs text-sidebar-foreground/70 dark:text-white">
                        {selectedModuleName}
                      </span>
                    </div>
                    <IconSelector className="ml-auto dark:text-white" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Modules
                  </DropdownMenuLabel>
                  {accessibleModules.map((module) => (
                    <DropdownMenuItem
                      key={module.name}
                      onClick={() => {
                        setActiveModule(module)
                        if (isMobile) {
                          setOpenMobile(false)
                        }
                        if (module.navMain?.[0]?.url) {
                          router.push(module.navMain[0].url)
                        }
                      }}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <module.logo className="size-4 shrink-0" />
                      </div>
                      {module.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Single module - just show the title without dropdown */
              <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt="HR Hub Logo" />
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold uppercase tracking-wider text-sidebar-foreground dark:text-white">
                    HR Hub
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70 dark:text-white">
                    {selectedModuleName}
                  </span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem className="px-2 py-1">
            <div className="relative">
              <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/70"
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavMain.length > 0 && <NavMain items={filteredNavMain} />}
        {filteredNavGroup.length > 0 && <NavGroup label="General" items={filteredNavGroup} />}
        {filteredNavSecondary.length > 0 && (
          <NavSecondary items={filteredNavSecondary} className="mt-auto" />
        )}
      </SidebarContent>
    </Sidebar>
  )
}
