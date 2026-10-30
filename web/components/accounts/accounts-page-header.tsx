"use client";

import { CompanySelect } from "./company-select";

export function AccountsPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <CompanySelect />
        {actions}
      </div>
    </div>
  );
}
