import type { ReactNode } from "react";

type PayrollPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PayrollPageHeader({ title, description, actions }: PayrollPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
