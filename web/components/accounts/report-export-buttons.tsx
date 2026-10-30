"use client";

import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/services/api-helpers";
import { accountsService } from "@/lib/services/accounts";
import type { ReportQueryParams } from "@/lib/services/accounts-types";
import { toast } from "sonner";
import { IconDownload } from "@tabler/icons-react";

export function ReportExportButtons({
  basePath,
  params,
  filePrefix,
  formats = ["xlsx", "pdf"],
}: {
  basePath: string;
  params: ReportQueryParams;
  filePrefix: string;
  formats?: ("csv" | "xlsx" | "pdf")[];
}) {
  const download = async (ext: "csv" | "xlsx" | "pdf") => {
    try {
      const res = await accountsService.exportReport(basePath, params, ext);
      downloadBlob(res.data, `${filePrefix}.${ext}`);
    } catch {
      toast.error(`Export ${ext.toUpperCase()} failed`);
    }
  };

  return (
    <div className="flex gap-2">
      {formats.includes("csv") && (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => download("csv")}>
          <IconDownload className="h-4 w-4" /> CSV
        </Button>
      )}
      {formats.includes("xlsx") && (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => download("xlsx")}>
          <IconDownload className="h-4 w-4" /> Excel
        </Button>
      )}
      {formats.includes("pdf") && (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => download("pdf")}>
          <IconDownload className="h-4 w-4" /> PDF
        </Button>
      )}
    </div>
  );
}
