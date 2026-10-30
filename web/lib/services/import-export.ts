import api from "../api";
import { unwrapApiData } from "@/lib/api-response";

const BASE = "import-export";

export interface ImportRowError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportPreviewResult {
  sessionId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportRowError[];
  errorsTruncated?: boolean;
}

export interface ImportJobResult {
  id: string;
  companyId: string;
  moduleName: string;
  status: string;
  totalRows?: number;
  successRows: number;
  failedRows: number;
  createdRows?: number;
  updatedRows?: number;
  errorFilePath?: string;
  createdAt: string;
}

/** UI shape used by organogram / legacy import pages */
export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  createdCount: number;
  updatedCount: number;
  errors: ImportRowError[];
  warnings: Array<{ rowNumber: number; message: string }>;
}

interface IeRowError {
  row?: number;
  column?: string;
  message?: string;
}

function mapRowError(e: IeRowError): ImportRowError {
  return {
    rowNumber: e.row ?? 0,
    field: e.column ?? "",
    message: e.message ?? "",
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadGet(path: string, filename: string) {
  const response = await api.get(path, { responseType: "blob" });
  downloadBlob(new Blob([response.data]), filename);
}

export const importExportService = {
  downloadTemplate: async (module: string) => {
    await downloadGet(
      `${BASE}/templates/${encodeURIComponent(module)}/download`,
      `${module}_import_template.xlsx`,
    );
  },

  previewImport: async (module: string, file: File): Promise<ImportPreviewResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>(
      `${BASE}/import/${encodeURIComponent(module)}/preview`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const data = unwrapApiData<{
      sessionId: string;
      totalRows: number;
      validRows: number;
      invalidRows: number;
      errors?: IeRowError[];
      errorsTruncated?: boolean;
    }>(response.data);
    return {
      sessionId: data.sessionId,
      totalRows: data.totalRows,
      validRows: data.validRows,
      invalidRows: data.invalidRows,
      errorsTruncated: data.errorsTruncated,
      errors: (data.errors ?? []).map(mapRowError),
    };
  },

  confirmImport: async (module: string, sessionId: string): Promise<ImportJobResult> => {
    const isEmployee = module.toLowerCase() === "employee" || module.toLowerCase() === "employees";
    const response = await api.post<unknown>(
      `${BASE}/import/${encodeURIComponent(module)}/confirm`,
      { sessionId },
      isEmployee ? { timeout: 30 * 60 * 1000 } : undefined,
    );
    const data = unwrapApiData<ImportJobResult>(response.data);
    return data;
  },

  downloadOrganogramDemo: async () => {
    await downloadGet(
      `${BASE}/company-organogram/demo-format`,
      "company-organogram-import-demo.xlsx",
    );
  },

  exportOrganogram: async (companyName?: string) => {
    const qs = companyName
      ? `?companyName=${encodeURIComponent(companyName)}`
      : "";
    await downloadGet(
      `${BASE}/company-organogram/export${qs}`,
      "company-organogram-export.xlsx",
    );
  },

  importOrganogram: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>(
      `${BASE}/company-organogram/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const data = unwrapApiData<{
      totalRows: number;
      successRows: number;
      failedRows: number;
      companiesCreated?: number;
      departmentsCreated?: number;
      departmentsUpdated?: number;
      sectionsCreated?: number;
      sectionsUpdated?: number;
      designationsCreated?: number;
      designationsUpdated?: number;
      linesCreated?: number;
      linesUpdated?: number;
      errors?: IeRowError[];
    }>(response.data);
    const createdCount =
      (data.companiesCreated ?? 0) +
      (data.departmentsCreated ?? 0) +
      (data.sectionsCreated ?? 0) +
      (data.designationsCreated ?? 0) +
      (data.linesCreated ?? 0);
    const updatedCount =
      (data.departmentsUpdated ?? 0) +
      (data.sectionsUpdated ?? 0) +
      (data.designationsUpdated ?? 0) +
      (data.linesUpdated ?? 0);
    return {
      totalRows: data.totalRows,
      successCount: data.successRows,
      errorCount: data.failedRows,
      warningCount: 0,
      createdCount,
      updatedCount,
      errors: (data.errors ?? []).map(mapRowError),
      warnings: [],
    };
  },

  downloadAddressDemo: async () => {
    await downloadGet(`${BASE}/address/demo-format`, "address-import-demo.xlsx");
  },

  importAddress: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>(`${BASE}/address/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const data = unwrapApiData<{
      totalRows: number;
      successRows: number;
      failedRows: number;
      countriesCreated?: number;
      countriesUpdated?: number;
      divisionsCreated?: number;
      divisionsUpdated?: number;
      districtsCreated?: number;
      districtsUpdated?: number;
      thanasCreated?: number;
      thanasUpdated?: number;
      postOfficesCreated?: number;
      postOfficesUpdated?: number;
      errors?: IeRowError[];
    }>(response.data);
    const createdCount =
      (data.countriesCreated ?? 0) +
      (data.divisionsCreated ?? 0) +
      (data.districtsCreated ?? 0) +
      (data.thanasCreated ?? 0) +
      (data.postOfficesCreated ?? 0);
    const updatedCount =
      (data.countriesUpdated ?? 0) +
      (data.divisionsUpdated ?? 0) +
      (data.districtsUpdated ?? 0) +
      (data.thanasUpdated ?? 0) +
      (data.postOfficesUpdated ?? 0);
    return {
      totalRows: data.totalRows,
      successCount: data.successRows,
      errorCount: data.failedRows,
      warningCount: 0,
      createdCount,
      updatedCount,
      errors: (data.errors ?? []).map(mapRowError),
      warnings: [],
    };
  },

  listImportJobs: async (module?: string): Promise<ImportJobResult[]> => {
    const response = await api.get<unknown>(`${BASE}/import-jobs`, {
      params: module ? { module } : undefined,
    });
    return unwrapApiData<ImportJobResult[]>(response.data) ?? [];
  },

  getImportJob: async (id: string): Promise<ImportJobResult> => {
    const response = await api.get<unknown>(`${BASE}/import-jobs/${id}`);
    return unwrapApiData<ImportJobResult>(response.data);
  },

  /** Poll until job leaves Pending/Processing (large imports). */
  waitForImportJob: async (
    id: string,
    options?: {
      intervalMs?: number;
      maxAttempts?: number;
      onProgress?: (job: ImportJobResult) => void;
    },
  ): Promise<ImportJobResult> => {
    const intervalMs = options?.intervalMs ?? 800;
    const maxAttempts = options?.maxAttempts ?? 900;
    for (let i = 0; i < maxAttempts; i++) {
      const job = await importExportService.getImportJob(id);
      options?.onProgress?.(job);
      const status = job.status?.toLowerCase() ?? "";
      if (status !== "pending" && status !== "processing") {
        return job;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Import is still processing. Check import jobs later.");
  },

  downloadImportErrorFile: async (jobId: string) => {
    await downloadGet(
      `${BASE}/import-jobs/${jobId}/error-file`,
      `import_errors_${jobId}.xlsx`,
    );
  },

  exportModule: async (
    module: string,
    options?: { format?: string; filters?: Record<string, unknown> },
  ) => {
    const response = await api.post(
      `${BASE}/export/${encodeURIComponent(module)}`,
      {
        format: options?.format ?? "Excel",
        filters: options?.filters ?? {},
      },
      { responseType: "blob" },
    );
    const ext = (options?.format ?? "Excel").toLowerCase() === "csv" ? "csv" : "xlsx";
    downloadBlob(new Blob([response.data]), `${module}_export.${ext}`);
  },
};

/** Map import job to employee-import result UI */
export function importJobToEmployeeResult(job: ImportJobResult): {
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  createdCount: number;
  updatedCount: number;
  errors: ImportRowError[];
  warnings: ImportRowError[];
  jobId: string;
  errorFilePath?: string;
} {
  return {
    totalRows: job.totalRows ?? job.successRows + job.failedRows,
    successCount: job.successRows,
    errorCount: job.failedRows,
    warningCount: 0,
    createdCount: job.createdRows ?? 0,
    updatedCount: job.updatedRows ?? 0,
    errors: [],
    warnings: [],
    jobId: job.id,
    errorFilePath: job.errorFilePath,
  };
}
