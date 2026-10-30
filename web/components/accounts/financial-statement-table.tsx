"use client";

import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function FinancialStatementTable({ report }: { report: FinancialStatementDto | null }) {
  if (!report) return <p className="text-muted-foreground text-sm">No data.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Debit</TableHead>
          <TableHead className="text-right">Credit</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {report.lines.map((line, i) => (
          <TableRow key={`${line.code}-${i}`}>
            <TableCell>{line.code}</TableCell>
            <TableCell>{line.name}</TableCell>
            <TableCell className="text-right">{formatCurrency(line.debit)}</TableCell>
            <TableCell className="text-right">{formatCurrency(line.credit)}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(line.balance)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="font-bold bg-muted/30">
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">{formatCurrency(report.totalDebit)}</TableCell>
          <TableCell className="text-right">{formatCurrency(report.totalCredit)}</TableCell>
          <TableCell className="text-right">{formatCurrency(report.netAmount)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
