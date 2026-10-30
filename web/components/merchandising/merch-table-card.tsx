"use client";

import { IconLoader } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MerchTableCardProps = {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  className?: string;
};

export function MerchTableCard({
  children,
  isLoading = false,
  loadingMessage = "Loading...",
  className,
}: MerchTableCardProps) {
  return (
    <Card
      className={cn(
        "border-none shadow-xl rounded-2xl overflow-hidden bg-background",
        className,
      )}
    >
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <IconLoader className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">
              {loadingMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
