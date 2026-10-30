"use client";

import type { GeneralLedgerEntryDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LedgerTable({ entries }: { entries: GeneralLedgerEntryDto[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">No ledger entries.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Debit</TableHead>
          <TableHead className="text-right">Credit</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell>{e.transactionDate}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{e.referenceNo ?? "—"}</TableCell>
            <TableCell className="text-right">{formatCurrency(e.debitAmount)}</TableCell>
            <TableCell className="text-right">{formatCurrency(e.creditAmount)}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(e.balanceAmount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
