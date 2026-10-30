import api from "@/lib/api";
import { platformApiUrl, downloadBlob } from "@/lib/services/api-helpers";

export type HrReportExportFormat = "csv" | "xlsx" | "pdf";

export type HrReportExportParams = Record<
  string,
  string | number | boolean | undefined | null
>;

function cleanParams(params: HrReportExportParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }
  return out;
}

/** GET `{exportUrl}/export.{format}` and download blob (matches Accounts/HR backend pattern). */
export async function exportHrReport(
  exportUrl: string,
  params: HrReportExportParams,
  format: HrReportExportFormat,
  filePrefix: string,
): Promise<void> {
  const path = exportUrl.endsWith("/")
    ? `${exportUrl.slice(0, -1)}/export.${format}`
    : `${exportUrl}/export.${format}`;
  const response = await api.get<Blob>(platformApiUrl(path), {
    params: cleanParams(params),
    responseType: "blob",
  });
  const mime =
    format === "pdf"
      ? "application/pdf"
      : format === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  downloadBlob(response.data, `${filePrefix}.${format}`, mime);
}

/** Bill endpoints use `{base}/export.{format}` on the bill controller root. */
export async function exportBillReport(
  billEndpoint: string,
  params: HrReportExportParams,
  format: Exclude<HrReportExportFormat, "csv">,
  filePrefix: string,
): Promise<void> {
  const response = await api.get<Blob>(
    platformApiUrl(`/api/v1/${billEndpoint}/export.${format}`),
    { params: cleanParams(params), responseType: "blob" },
  );
  downloadBlob(
    response.data,
    `${filePrefix}.${format}`,
    format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
