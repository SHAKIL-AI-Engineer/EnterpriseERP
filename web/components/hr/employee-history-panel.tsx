"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeService } from "@/lib/services/employee";
import type { HrStatusHistoryItem, HrTransferItem } from "@/lib/services/hr-types";
import { format } from "date-fns";
import { IconLoader } from "@tabler/icons-react";
import { toast } from "sonner";

type EmployeeHistoryPanelProps = {
  employeeId: string;
  companyId?: number;
};

export function EmployeeHistoryPanel({
  employeeId,
  companyId,
}: EmployeeHistoryPanelProps) {
  const [statusHistory, setStatusHistory] = React.useState<HrStatusHistoryItem[]>(
    [],
  );
  const [transfers, setTransfers] = React.useState<HrTransferItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [transfersError, setTransfersError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTransfersError(false);
      const [statusResult, transferResult] = await Promise.allSettled([
        employeeService.getStatusHistory(employeeId, companyId),
        employeeService.getEmployeeTransfers(employeeId, companyId),
      ]);
      if (cancelled) return;

      if (statusResult.status === "fulfilled") {
        setStatusHistory(statusResult.value);
      } else {
        setStatusHistory([]);
        toast.error("Failed to load status history");
      }

      if (transferResult.status === "fulfilled") {
        setTransfers(transferResult.value);
      } else {
        setTransfers([]);
        setTransfersError(true);
        toast.error("Failed to load transfer history");
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, companyId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes yet.</p>
          ) : (
            statusHistory.map((row) => (
              <div
                key={row.id}
                className="border-l-2 border-primary/30 pl-3 text-sm"
              >
                <p className="font-semibold">{row.status}</p>
                <p className="text-muted-foreground">
                  {format(new Date(row.effectiveFrom), "dd MMM yyyy")}
                </p>
                {row.remarks ? (
                  <p className="text-muted-foreground mt-1">{row.remarks}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transfer history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transfersError ? (
            <p className="text-sm text-muted-foreground">
              Transfer history could not be loaded.
            </p>
          ) : transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transfers yet.</p>
          ) : (
            transfers.map((row) => (
              <div
                key={row.id}
                className="border-l-2 border-primary/30 pl-3 text-sm"
              >
                <p className="font-semibold">
                  {row.fromDepartmentName ?? "—"} → {row.toDepartmentName ?? "—"}
                </p>
                <p className="text-muted-foreground">
                  {format(new Date(row.effectiveDate), "dd MMM yyyy")}
                </p>
                {row.reason ? (
                  <p className="text-muted-foreground mt-1">{row.reason}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
