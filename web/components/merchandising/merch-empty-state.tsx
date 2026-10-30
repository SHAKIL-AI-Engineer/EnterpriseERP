"use client";

import { IconBuilding, IconLoader } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MerchEmptyStateProps = {
  variant?: "no-company" | "coming-soon" | "empty" | "loading";
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
};

const defaults = {
  "no-company": {
    title: "Select a company",
    description: "Choose an active company from the header to load merchandising data.",
  },
  "coming-soon": {
    title: "Coming soon",
    description: "This area will be connected when the related service is available.",
  },
  empty: {
    title: "No data",
    description: "Nothing to show for the current filters.",
  },
  loading: {
    title: "Loading",
    description: "Please wait...",
  },
} as const;

export function MerchEmptyState({
  variant = "empty",
  title,
  description,
  className,
  action,
}: MerchEmptyStateProps) {
  const d = defaults[variant];
  return (
    <Card className={cn("border-none shadow-sm", className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
        {variant === "loading" ? (
          <IconLoader className="size-10 text-primary animate-spin" />
        ) : (
          <IconBuilding className="size-10 text-muted-foreground/50" />
        )}
        <h2 className="text-lg font-semibold">{title ?? d.title}</h2>
        <p className="text-sm text-muted-foreground max-w-md">{description ?? d.description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
