"use client";

import { IconFilter, IconLoader } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HrFilterCardProps = {
  children: React.ReactNode;
  recordCount?: number;
  recordLabel?: string;
  isLoading?: boolean;
  onApply?: () => void;
  onReset?: () => void;
  applyLabel?: string;
  className?: string;
};

export function HrFilterCard({
  children,
  recordCount,
  recordLabel = "Records Found",
  isLoading = false,
  onApply,
  onReset,
  applyLabel = "Apply Filters",
  className,
}: HrFilterCardProps) {
  return (
    <Card className={cn("border-none shadow-sm bg-muted/30", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
            </div>
            {typeof recordCount === "number" ? (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 font-mono text-[10px] bg-primary/10 text-primary border-primary/20"
              >
                {recordCount} {recordLabel}
              </Badge>
            ) : null}
          </div>
          {(onApply || onReset) && (
            <div className="flex items-center gap-2">
              {onApply ? (
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 text-xs gap-1.5 px-4 shadow-sm shadow-primary/20"
                  onClick={onApply}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <IconLoader className="size-3.5 animate-spin" />
                  ) : (
                    <IconFilter className="size-3.5" />
                  )}
                  {applyLabel}
                </Button>
              ) : null}
              {onReset ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-8 text-xs hover:text-destructive hover:bg-destructive/10"
                  onClick={onReset}
                  disabled={isLoading}
                >
                  Reset Filters
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function HrFilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[10px] uppercase font-bold text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
