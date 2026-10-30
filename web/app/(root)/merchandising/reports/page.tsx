"use client";

import * as React from "react";
import {
  IconReport,
  IconFileDownload,
  IconEye,
  IconLoader2,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";

type ReportId =
  | "order-summary"
  | "order-pipeline"
  | "tna-delay"
  | "booking-status";

const REPORTS: Array<{
  id: ReportId;
  title: string;
  description: string;
  preview: (companyId: string) => Promise<unknown>;
  exportCsv: (companyId: string) => Promise<void>;
}> = [
  {
    id: "order-summary",
    title: "Order summary",
    description: "Orders with quantities and values.",
    preview: (companyId) => merchandisingService.getOrderSummaryReport(companyId),
    exportCsv: (companyId) => merchandisingService.exportOrderSummaryReport(companyId),
  },
  {
    id: "order-pipeline",
    title: "Order pipeline",
    description: "Orders grouped by status with totals.",
    preview: (companyId) => merchandisingService.getOrderPipelineReport(companyId),
    exportCsv: (companyId) => merchandisingService.exportOrderPipelineReport(companyId),
  },
  {
    id: "tna-delay",
    title: "T&A delay",
    description: "Milestone delays across active orders.",
    preview: (companyId) => merchandisingService.getTnaDelayReport(companyId),
    exportCsv: (companyId) => merchandisingService.exportTnaDelayReport(companyId),
  },
  {
    id: "booking-status",
    title: "Booking status",
    description: "Material booking fulfillment status.",
    preview: (companyId) => merchandisingService.getBookingStatusReport(companyId),
    exportCsv: (companyId) => merchandisingService.exportBookingStatusReport(companyId),
  },
];

export default function MerchandisingReportsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <MerchandisingReportsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function MerchandisingReportsPageContent({ companyId }: { companyId: string }) {
  const [downloading, setDownloading] = React.useState<ReportId | null>(null);
  const [previewing, setPreviewing] = React.useState<ReportId | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewTitle, setPreviewTitle] = React.useState("");
  const [previewJson, setPreviewJson] = React.useState("");

  const handleDownload = async (reportId: ReportId) => {
    const report = REPORTS.find((r) => r.id === reportId);
    if (!report) return;
    try {
      setDownloading(reportId);
      await report.exportCsv(companyId);
      toast.success("Report downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (reportId: ReportId) => {
    const report = REPORTS.find((r) => r.id === reportId);
    if (!report) return;
    try {
      setPreviewing(reportId);
      const data = await report.preview(companyId);
      setPreviewTitle(report.title);
      setPreviewJson(JSON.stringify(data, null, 2));
      setPreviewOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Preview failed");
    } finally {
      setPreviewing(null);
    }
  };

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconReport className="size-6" />}
        title="Merchandising reports"
        description="Preview report data as JSON or export CSV"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((rep) => (
          <Card key={rep.id} className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">{rep.title}</CardTitle>
              <CardDescription>{rep.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={previewing === rep.id}
                onClick={() => handlePreview(rep.id)}
              >
                {previewing === rep.id ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconEye className="size-4" />
                )}
                Preview JSON
              </Button>
              <Button
                size="sm"
                className="gap-2"
                disabled={downloading === rep.id}
                onClick={() => handleDownload(rep.id)}
              >
                {downloading === rep.id ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconFileDownload className="size-4" />
                )}
                Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>Report preview (JSON)</DialogDescription>
          </DialogHeader>
          <pre className="flex-1 overflow-auto rounded-md bg-muted p-4 text-xs font-mono max-h-[50vh]">
            {previewJson}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  );
}
