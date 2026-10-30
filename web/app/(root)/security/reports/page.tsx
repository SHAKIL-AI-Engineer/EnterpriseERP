"use client";

import * as React from "react";
import { IconReportSearch, IconLoader2, IconDownload, IconEye } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SecurityPageShell, SecurityCompanyGate, SecurityDatePicker, todayIsoDate } from "@/components/security";
import { canExportReports } from "@/components/security/security-roles";
import { useAuth } from "@/components/providers/auth-provider";
import { securityService } from "@/lib/services/security";
import type {
  MaterialInOutReport,
  ReturnablePending,
  SecurityReport,
} from "@/lib/types/security";

const REPORT_TYPES = [
  { value: "Visitor", label: "Visitor report", needsRange: true },
  { value: "MaterialInOut", label: "Material in/out", needsRange: true },
  { value: "Vehicle", label: "Vehicle report", needsRange: true },
  { value: "ReturnablePending", label: "Returnable pending", needsRange: false },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]["value"];


export default function SecurityReportsPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <ReportsContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function ReportsContent({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const canExport = canExportReports(roles);
  const [reportType, setReportType] = React.useState<ReportType>("Visitor");
  const [fromDate, setFromDate] = React.useState(() => todayIsoDate());
  const [toDate, setToDate] = React.useState(() => todayIsoDate());
  const [preview, setPreview] = React.useState<unknown>(null);
  const [reportName, setReportName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const selectedMeta = REPORT_TYPES.find((r) => r.value === reportType)!;

  const loadPreview = async () => {
    setLoading(true);
    setPreview(null);
    try {
      let data: SecurityReport | MaterialInOutReport | ReturnablePending[];
      let name: string = reportType;
      switch (reportType) {
        case "Visitor": {
          const res = await securityService.getVisitorReport(companyId, fromDate, toDate);
          data = res;
          name = res.reportName || "Visitor";
          break;
        }
        case "MaterialInOut": {
          const res = await securityService.getMaterialInOutReport(companyId, fromDate, toDate);
          data = res;
          name = "MaterialInOut";
          break;
        }
        case "Vehicle": {
          const res = await securityService.getVehicleReport(companyId, fromDate, toDate);
          data = res;
          name = res.reportName || "Vehicle";
          break;
        }
        case "ReturnablePending": {
          data = await securityService.getReturnablePending(companyId);
          name = "ReturnablePending";
          break;
        }
        default:
          return;
      }
      setReportName(name);
      if (reportType === "MaterialInOut") {
        const mat = data as MaterialInOutReport;
        setPreview({
          materialIn: mat.materialIn?.length ?? 0,
          materialOut: mat.materialOut?.length ?? 0,
          fromDate: mat.fromDate,
          toDate: mat.toDate,
        });
      } else if (reportType === "ReturnablePending") {
        setPreview(data);
      } else {
        const rep = data as SecurityReport;
        setPreview(rep.data ?? rep);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load report preview");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "Excel" | "PDF") => {
    if (!canExport) {
      toast.error("You do not have permission to export reports");
      return;
    }
    setExporting(true);
    try {
      await securityService.exportReport(
        {
          companyId,
          reportName: reportName || reportType,
          format,
          fromDate: selectedMeta.needsRange ? fromDate : null,
          toDate: selectedMeta.needsRange ? toDate : null,
          date: selectedMeta.needsRange ? null : todayIsoDate(),
        },
        `${reportType}_${fromDate}_${toDate}`,
      );
      toast.success("Export started");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
          <IconReportSearch className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gate Reports</h1>
          <p className="text-sm text-muted-foreground">Preview and export security reports.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report parameters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="grid gap-1">
            <Label className="text-xs">Report type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedMeta.needsRange && (
            <>
              <div className="grid gap-1">
                <Label className="text-xs">From</Label>
                <SecurityDatePicker
                  className="w-[200px]"
                  value={fromDate}
                  onChange={setFromDate}
                  placeholder="From date"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">To</Label>
                <SecurityDatePicker
                  className="w-[200px]"
                  value={toDate}
                  onChange={setToDate}
                  placeholder="To date"
                />
              </div>
            </>
          )}
          <Button onClick={loadPreview} disabled={loading}>
            {loading ? (
              <IconLoader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <IconEye className="size-4 mr-2" />
            )}
            Preview
          </Button>
          {canExport && (
            <>
              <Button
                variant="outline"
                disabled={exporting || !preview}
                onClick={() => handleExport("Excel")}
              >
                <IconDownload className="size-4 mr-2" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                disabled={exporting || !preview}
                onClick={() => handleExport("PDF")}
              >
                <IconDownload className="size-4 mr-2" />
                Export PDF
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : preview === null ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select parameters and click Preview.
            </p>
          ) : (
            <pre className="text-xs overflow-auto max-h-[480px] rounded-md bg-muted/50 p-4">
              {JSON.stringify(preview, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
