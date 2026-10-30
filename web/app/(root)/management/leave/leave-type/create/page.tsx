"use client";

import * as React from "react";
import Link from "next/link";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveTypeForm } from "@/components/leave/leave-type-form";
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter";
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate";

export default function CreateLeaveTypePage() {
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>();

  return (
    <div className="flex flex-col gap-6 py-6 px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/management/leave/leave-type">
            <IconChevronLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconPlus className="size-6" /> Create leave type
          </h1>
          <p className="text-muted-foreground text-sm">
            Add a new leave type and entitlement policy for the selected company.
          </p>
        </div>
      </div>
      <LeaveAdvancedFilter
        onFilterChange={(f: LeaveFilterParams) => setSelectedCompanyId(f.companyEntityId)}
      />
      <LeavePermissionGate permission="LEAVE_TYPE_MANAGE">
        <Card>
          <CardHeader>
            <CardTitle>Leave type details</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveTypeForm
              key={selectedCompanyId ?? "pending"}
              defaultCompanyEntityId={selectedCompanyId}
            />
          </CardContent>
        </Card>
      </LeavePermissionGate>
    </div>
  );
}
