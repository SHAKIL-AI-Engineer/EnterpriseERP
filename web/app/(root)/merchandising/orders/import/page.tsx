"use client";

import * as React from "react";
import {
  IconFileUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconX,
  IconLoader2,
  IconArrowLeft,
  IconAlertCircle,
  IconDownload,
  IconTableImport,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { merchandisingService } from "@/lib/services/merchandising";
import type { OrderImportPreviewDto, OrderImportRowDto } from "@/lib/types/merchandising";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  MerchPageShell,
  MerchPageHeader,
  MerchCompanyGate,
} from "@/components/merchandising";

function parseImportRows(file: File): Promise<OrderImportRowDto[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
          defval: "",
        });
        const rows: OrderImportRowDto[] = json.map((row) => ({
          orderNo: String(row.OrderNo ?? row.orderNo ?? "").trim(),
          buyerCode: String(row.BuyerCode ?? row.buyerCode ?? "").trim(),
          styleNo: String(row.StyleNo ?? row.styleNo ?? "").trim(),
          orderDate: String(row.OrderDate ?? row.orderDate ?? "").trim(),
          shipmentDate:
            String(row.ShipmentDate ?? row.shipmentDate ?? "").trim() || undefined,
          totalQty: Number(row.TotalQty ?? row.totalQty ?? 0),
          unitPrice: Number(row.UnitPrice ?? row.unitPrice ?? 0),
          currency: String(row.Currency ?? row.currency ?? "USD").trim(),
          colorName: String(row.ColorName ?? row.colorName ?? "").trim(),
          sizeName: String(row.SizeName ?? row.sizeName ?? "").trim(),
          quantity: Number(row.Quantity ?? row.quantity ?? 0),
        }));
        resolve(rows.filter((r) => r.orderNo));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function OrderImportPageContent({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [previewData, setPreviewData] = React.useState<OrderImportPreviewDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
    }
  };

  const handleUploadPreview = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    try {
      setLoading(true);
      const data = await merchandisingService.previewOrderImport(file, companyId);
      setPreviewData(data);
      toast.success("File analyzed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze file");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file || !previewData) return;
    try {
      setImporting(true);
      const allRows = await parseImportRows(file);
      const validKeys = new Set(
        previewData.rows
          .filter((r) => r.isValid)
          .map((r) => `${r.orderNo}|${r.buyerCode}|${r.styleNo}|${r.colorName}|${r.sizeName}`),
      );
      const rowsToImport = allRows.filter((r) =>
        validKeys.has(`${r.orderNo}|${r.buyerCode}|${r.styleNo}|${r.colorName}|${r.sizeName}`),
      );
      if (rowsToImport.length === 0) {
        toast.error("No valid rows to import");
        return;
      }
      await merchandisingService.importOrders({ companyId, rows: rowsToImport });
      toast.success("Orders imported successfully");
      router.push("/merchandising/orders");
    } catch (error) {
      console.error(error);
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconTableImport className="size-6" />}
        title="Bulk Order Import"
        description="CSV or Excel order import with validation preview"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/merchandising/orders")}>
              <IconArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => merchandisingService.downloadOrderImportTemplate()}
            >
              <IconDownload className="size-4 mr-2" /> Download Template
            </Button>
            {previewData && (
              <Button
                size="sm"
                disabled={importing || previewData.validCount === 0}
                onClick={handleConfirmImport}
              >
                {importing ? (
                  <IconLoader2 className="animate-spin mr-2 size-4" />
                ) : (
                  <IconTableImport className="size-4 mr-2" />
                )}
                Import {previewData.validCount} Rows
              </Button>
            )}
          </>
        }
      />

      {!previewData ? (
        <Card className="border-2 border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <IconFileUpload size={40} className="mb-6 text-muted-foreground" />
            <h2 className="text-lg font-bold">Choose Import File</h2>
            <p className="text-muted-foreground text-xs mt-1 mb-8">
              Supported: .csv, .xlsx, .xls
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="excel-upload"
              onChange={handleFileChange}
            />
            <label htmlFor="excel-upload">
              <Button asChild variant="outline">
                <span>{file ? file.name : "Browse Files"}</span>
              </Button>
            </label>
            {file && (
              <Button onClick={handleUploadPreview} className="mt-4" disabled={loading}>
                {loading ? (
                  <IconLoader2 className="animate-spin mr-2" />
                ) : (
                  <IconFileSpreadsheet className="mr-2" />
                )}
                Analyze File
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Rows" value={previewData.totalCount} />
            <StatCard label="Valid Rows" value={previewData.validCount} className="text-green-600" />
            <StatCard
              label="Invalid Rows"
              value={previewData.invalidCount}
              className="text-red-600"
            />
          </div>
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/50 flex justify-between">
              <h3 className="text-sm font-bold">Validation Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewData(null);
                  setFile(null);
                }}
              >
                Reset
              </Button>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 border-b sticky top-0">
                  <tr>
                    <th className="p-3 w-12" />
                    <th className="p-3 font-bold uppercase text-[10px]">Order No</th>
                    <th className="p-3 font-bold uppercase text-[10px]">Buyer</th>
                    <th className="p-3 font-bold uppercase text-[10px]">Style</th>
                    <th className="p-3 font-bold uppercase text-[10px]">Color</th>
                    <th className="p-3 font-bold uppercase text-[10px]">Size</th>
                    <th className="p-3 font-bold uppercase text-[10px] text-center">Qty</th>
                    <th className="p-3 font-bold uppercase text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx} className={!row.isValid ? "bg-red-500/10" : ""}>
                      <td className="p-3 text-center">
                        {row.isValid ? (
                          <IconCheck className="text-green-600 size-4 mx-auto" />
                        ) : (
                          <IconX className="text-red-600 size-4 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 font-bold">{row.orderNo}</td>
                      <td className="p-3">{row.buyerCode}</td>
                      <td className="p-3 font-mono">{row.styleNo}</td>
                      <td className="p-3">{row.colorName}</td>
                      <td className="p-3">{row.sizeName}</td>
                      <td className="p-3 text-center font-bold">{row.quantity}</td>
                      <td className="p-3">
                        {!row.isValid ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <IconAlertCircle size={12} />
                            {row.errorMessage}
                          </span>
                        ) : (
                          <span className="text-green-600 font-bold uppercase text-[9px]">
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </MerchPageShell>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${className ?? ""}`}>{value}</p>
    </div>
  );
}

export default function OrderImportPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <OrderImportPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}
