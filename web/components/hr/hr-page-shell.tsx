"use client";

import { cn } from "@/lib/utils";

type HrPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function HrPageShell({ children, className }: HrPageShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 py-6 bg-muted/20 min-h-screen w-full px-4 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
