import api from "../api";
import { unwrapApiData } from "@/lib/api-response";
import type { ImportPreviewResult, ImportRowError } from "@/lib/services/import-export";

export interface EmployeeExcelImportResult {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
    successCount: number;
    errorCount: number;
    errors: ImportRowError[];
}

interface RowErrorDto {
    rowNumber: number;
    field: string;
    message: string;
}

const BASE = "hr/Employees/excel-import";
const confirmTimeoutMs = 30 * 60 * 1000;

export const employeeExcelImportService = {
    /** Parse Excel in HR service; valid rows staged in memory (no ImportExport DB/Redis). */
    previewImport: async (file: File): Promise<ImportPreviewResult> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<unknown>(`${BASE}/preview`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        const data = unwrapApiData<{
            sessionId: string;
            totalRows: number;
            validRows: number;
            invalidRows: number;
            errors?: RowErrorDto[];
            errorsTruncated?: boolean;
        }>(response.data);
        return {
            sessionId: data.sessionId,
            totalRows: data.totalRows,
            validRows: data.validRows,
            invalidRows: data.invalidRows,
            errorsTruncated: data.errorsTruncated,
            errors: (data.errors ?? []).map((e) => ({
                rowNumber: e.rowNumber,
                field: e.field,
                message: e.message,
            })),
        };
    },

    /** Upsert all valid rows directly into HR database (synchronous, no job queue). */
    confirmImport: async (sessionId: string): Promise<EmployeeExcelImportResult> => {
        const response = await api.post<unknown>(
            `${BASE}/confirm`,
            { sessionId },
            { timeout: confirmTimeoutMs },
        );
        const data = unwrapApiData<{
            totalRows: number;
            created: number;
            updated: number;
            failed: number;
            errors?: RowErrorDto[];
        }>(response.data);
        return {
            totalRows: data.totalRows,
            createdCount: data.created,
            updatedCount: data.updated,
            successCount: data.created + data.updated,
            errorCount: data.failed,
            errors: (data.errors ?? []).map((e) => ({
                rowNumber: e.rowNumber,
                field: e.field,
                message: e.message,
            })),
        };
    },
};
