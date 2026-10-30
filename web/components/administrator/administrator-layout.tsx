"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconActivity,
  IconAlertTriangle,
  IconBug,
  IconClipboardCheck,
  IconFileText,
  IconHome,
  IconLock,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const sections = [
  { title: "Overview", href: "/administrator", icon: IconHome },
  { title: "Users", href: "/administrator/users", icon: IconUsers },
  { title: "Roles & access", href: "/administrator/permissions", icon: IconLock },
  { title: "Approvals", href: "/administrator/approvals", icon: IconClipboardCheck },
  { title: "System logs", href: "/administrator/logs", icon: IconFileText },
  { title: "Error handling", href: "/administrator/errors", icon: IconAlertTriangle },
  { title: "System bugs", href: "/administrator/bugs", icon: IconBug },
];

export function AdministratorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-6">
      <header className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <IconActivity className="size-4" />
              ADMINISTRATOR WORKSPACE
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Administrator</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage access, approvals, and system operations from one place.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">Restricted to authorized administrators</div>
        </div>
        <nav aria-label="Administrator sections" className="mt-6 flex gap-2 overflow-x-auto border-t pt-4">
          {sections.map((section) => {
            const active = section.href === "/administrator"
              ? pathname === section.href
              : pathname === section.href || pathname.startsWith(`${section.href}/`);
            const Icon = section.icon;

            return (
              <Link
                key={section.href}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {section.title}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
