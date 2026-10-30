"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  exportBillReport,
  exportHrReport,
  type HrReportExportFormat,
  type HrReportExportParams,
} from "@/lib/services/hr-report-export";
import { toast } from "sonner";
import { IconDownload, IconLoader2 } from "@tabler/icons-react";

export function HrReportExportButtons({
  exportUrl,
  params,
  filePrefix,
  formats = ["xlsx", "pdf"],
  disabled,
  loading: externalLoading,
  variant = "report",
}: {
  exportUrl: string;
  params: HrReportExportParams;
  filePrefix: string;
  formats?: HrReportExportFormat[];
  disabled?: boolean;
  loading?: boolean;
  /** report = `{url}/export.{ext}`; bill = `/api/v1/{url}/export.{ext}` */
  variant?: "report" | "bill";
}) {
  const [activeFormat, setActiveFormat] = React.useState<HrReportExportFormat | null>(null);
  const isBusy = externalLoading || activeFormat !== null;

  const download = async (ext: HrReportExportFormat) => {
    setActiveFormat(ext);
    try {
      if (variant === "bill") {
        if (ext === "csv") {
          toast.error("CSV export is available from the table toolbar");
          return;
        }
        await exportBillReport(exportUrl, params, ext, filePrefix);
      } else {
        await exportHrReport(exportUrl, params, ext, filePrefix);
      }
    } catch {
      toast.error(
        ext === "pdf"
          ? "Export failed — try narrowing date range"
          : `Export ${ext.toUpperCase()} failed`,
      );
    } finally {
      setActiveFormat(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {formats.includes("csv") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled || isBusy}
          onClick={() => download("csv")}
        >
          {activeFormat === "csv" ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconDownload className="h-4 w-4" />
          )}
          CSV
        </Button>
      )}
      {formats.includes("xlsx") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled || isBusy}
          onClick={() => download("xlsx")}
        >
          {activeFormat === "xlsx" ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconDownload className="h-4 w-4" />
          )}
          Excel
        </Button>
      )}
      {formats.includes("pdf") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled || isBusy}
          onClick={() => download("pdf")}
        >
          {activeFormat === "pdf" ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconDownload className="h-4 w-4" />
          )}
          PDF
        </Button>
      )}
    </div>
  );
}
