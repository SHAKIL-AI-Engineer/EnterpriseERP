import {
  attendanceApi,
  type AttendanceQuery,
  type JobCardResponse,
  type JobCardRosterItem,
  type PagedJobCardRoster,
} from "./attendance-api";
import api from "../api";

export type { JobCardRecord, JobCardSummary, EmployeeJobCard, JobCardResponse, JobCardRosterItem, PagedJobCardRoster } from "./attendance-api";

export interface JobCardParams {
  companyEntityId: string;
  startDate: string;
  endDate: string;
  departmentId?: string;
  sectionId?: string;
  designationId?: string;
  employeeID?: string;
}

function toAttendanceQuery(params: JobCardParams): AttendanceQuery {
  return {
    companyId: params.companyEntityId,
    fromDate: params.startDate,
    toDate: params.endDate,
    departmentId: params.departmentId,
    sectionId: params.sectionId,
    designationId: params.designationId,
    employeeID: params.employeeID,
  };
}

const downloadBlobFile = (data: BlobPart, fileName: string, mimeType: string) => {
  if (typeof window === "undefined") return;

  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  }
};

export const jobCardService = {
  getJobCardRoster: async (
    params: JobCardParams,
    opts: { page?: number; pageSize?: number } = {},
  ): Promise<PagedJobCardRoster> => {
    return attendanceApi.getJobCardRoster(toAttendanceQuery(params), {
      page: opts.page ?? 1,
      pageSize: opts.pageSize ?? 1,
    });
  },

  getJobCard: async (
    params: JobCardParams,
    employee: { employeeCard?: number; employeeId: string },
  ): Promise<JobCardResponse> => {
    return attendanceApi.getJobCard(toAttendanceQuery(params), {
      employeeCard: employee.employeeCard,
      employeeId: employee.employeeId,
    });
  },

  exportJobCardExcel: async (params: JobCardParams & { employeeCard?: number }) => {
    const response = await api.get("/attendance/job-card/export/excel", {
      params,
      responseType: "blob",
    });
    downloadBlobFile(
      response.data,
      `JobCard_${params.employeeID || "Group"}_${params.startDate}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  },

  exportJobCardPdf: async (params: JobCardParams & { employeeCard?: number }) => {
    const response = await api.get("/attendance/job-card/export/pdf", {
      params,
      responseType: "blob",
    });
    downloadBlobFile(
      response.data,
      `JobCard_${params.employeeID || "Group"}_${params.startDate}.pdf`,
      "application/pdf",
    );
  },
};
