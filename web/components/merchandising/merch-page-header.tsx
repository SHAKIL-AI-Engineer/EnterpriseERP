"use client";

import { cn } from "@/lib/utils";

type MerchPageHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  iconClassName?: string;
  className?: string;
};

export function MerchPageHeader({
  icon,
  title,
  description,
  actions,
  iconClassName,
  className,
}: MerchPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20 shrink-0",
            iconClassName,
          )}
        >
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
