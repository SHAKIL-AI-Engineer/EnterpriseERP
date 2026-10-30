"use client";

import { cn } from "@/lib/utils";

const linkClass =
  "text-foreground hover:text-erp-accent hover:underline transition-colors";

export function HrIdLink({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "font-mono text-xs font-semibold text-left",
        linkClass,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function HrNameLink({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("font-medium text-left", linkClass, className)}
    >
      {children}
    </button>
  );
}

export function HrCellText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("text-sm text-foreground", className)}>{children}</span>;
}
