"use client";

import { cn } from "@/lib/utils";

type StorePageShellProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "wide" | "full";
};

export function StorePageShell({
  children,
  className,
  maxWidth = "full",
}: StorePageShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 py-6 bg-muted/20 min-h-screen w-full px-4 lg:px-8",
        maxWidth === "default" && "max-w-7xl mx-auto",
        maxWidth === "wide" && "max-w-[1400px] mx-auto",
        maxWidth === "full" && "max-w-none w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
