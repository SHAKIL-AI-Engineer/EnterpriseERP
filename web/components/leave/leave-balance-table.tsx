"use client";

import type { BackendLeaveBalance } from "@/lib/services/leave";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LeaveBalanceTable({ balances }: { balances: BackendLeaveBalance[] }) {
  if (!balances.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No leave balances found for this year.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Leave Type</TableHead>
          <TableHead className="text-right">Entitled</TableHead>
          <TableHead className="text-right">Used</TableHead>
          <TableHead className="text-right">Pending</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {balances.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-medium">
              {b.leaveName || b.leaveCode || "Leave"}
            </TableCell>
            <TableCell className="text-right">{b.entitledDays}</TableCell>
            <TableCell className="text-right">{b.usedDays}</TableCell>
            <TableCell className="text-right">{b.pendingDays}</TableCell>
            <TableCell className="text-right font-semibold">{b.balanceDays}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
