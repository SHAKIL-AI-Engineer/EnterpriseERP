"use client";

import * as React from "react";
import { IconDownload, IconFileAnalytics } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CuttingPageShell, CuttingCompanyGate } from "@/components/cutting";
import { cuttingService } from "@/lib/services/cutting";
import { merchandisingService } from "@/lib/services/merchandising";
import type { CuttingReportRow } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

const REPORT_TYPES = [
  "Cutting Plan",
  "Lay Report",
  "Cutting Output",
  "Daily Cutting Production",
  "Cutting Wastage",
  "Cutting Balance",
  "Order Wise Cutting Summary",
  "Panel Transfer",
  "Color Size Cutting",
];

export default function CuttingReportPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <ReportsContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function ReportsContent({ companyId }: { companyId: string }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [rows, setRows] = React.useState<CuttingReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [reportType, setReportType] = React.useState("Cutting Output");
  const [orderId, setOrderId] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  React.useEffect(() => {
    merchandisingService
      .getOrders(companyId)
      .then(setOrders)
      .catch(() => toast.error("Failed to load orders"));
  }, [companyId]);

  const runReport = async () => {
    setLoading(true);
    try {
      const data = await cuttingService.getReport(
        reportType,
        companyId,
        orderId || undefined,
        fromDate || undefined,
        toDate || undefined,
      );
      setRows(data);
      if (data.length === 0) toast.info("No rows for selected filters");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "Excel" | "PDF") => {
    setExporting(true);
    try {
      const slug = reportType.replace(/\s+/g, "-").toLowerCase();
      await cuttingService.exportReport(
        {
          companyId,
          orderId: orderId || undefined,
          reportType,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          format,
        },
        `cutting-${slug}`,
      );
      toast.success("Report downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cutting Analysis Reports</h2>
          <p className="text-muted-foreground">
            Performance and efficiency metrics from cutting API
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={exporting}
            onClick={() => handleExport("PDF")}
          >
            <IconDownload className="h-4 w-4" /> PDF
          </Button>
          <Button
            className="gap-2"
            disabled={exporting}
            onClick={() => handleExport("Excel")}
          >
            <IconDownload className="h-4 w-4" /> XLS Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm bg-card/60 md:col-span-1">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <IconFileAnalytics className="h-4 w-4 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                Report type
              </Label>
              <NativeSelect
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                Order (optional)
              </Label>
              <NativeSelect
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">All orders</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                From
              </Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">
                To
              </Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <Button className="w-full" onClick={runReport} disabled={loading}>
              {loading ? "Loading…" : "Run Report"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm bg-card/60">
          <CardHeader>
            <CardTitle className="text-lg">Report Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan / Ref</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Wastage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Run a report to see data
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => (
                    <TableRow key={`${row.date}-${row.sizeName}-${i}`}>
                      <TableCell className="text-xs">{row.date}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {row.planNo ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">{row.colorName ?? "—"}</TableCell>
                      <TableCell className="text-xs">{row.sizeName || "—"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-rose-500 font-mono">
                        {row.wastageQty ? row.wastageQty.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {row.status ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
