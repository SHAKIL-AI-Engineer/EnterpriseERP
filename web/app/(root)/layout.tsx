import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SearchProvider } from "@/components/search-context"
import { CommandMenu } from "@/components/command-menu"
import { RouteAccessGuard } from "@/components/auth/route-access-guard"
import { CompanyProvider } from "@/components/providers/company-context"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteAccessGuard>
      <CompanyProvider>
      <SearchProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset className="min-w-0">
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                {children}
              </div>
            </div>
          </SidebarInset>
          <CommandMenu />
        </SidebarProvider>
      </SearchProvider>
      </CompanyProvider>
    </RouteAccessGuard>
  );
}
