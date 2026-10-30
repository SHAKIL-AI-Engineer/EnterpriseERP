import api from "@/lib/api"
import { platformApiUrl, unwrapResponse, downloadBlob } from "./api-helpers"

export interface BillDto {
  id: number
  employeeCard: number
  employeeId: string
  employeeName: string
  department: string
  designation: string
  date: string
  amount: number
  status: string
  createdAt: string
  shiftName: string
  companyName: string
  inTime?: string
  outTime?: string
  tiffinCount?: number
}

export interface BillSummaryDto {
  totalAmount: number
  totalEmployees: number
  totalRecords: number
}

export interface BillResponseDto {
  summary: BillSummaryDto
  records: BillDto[]
}

function mapRecord(r: BillDto & { tiffinCount?: number | null }): BillDto {
  return {
    id: r.id,
    employeeCard: r.employeeCard,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    department: r.department,
    designation: r.designation,
    date: r.date,
    amount: r.amount,
    status: r.status,
    createdAt: r.createdAt,
    shiftName: r.shiftName,
    companyName: r.companyName,
    inTime: r.inTime,
    outTime: r.outTime,
    tiffinCount: r.tiffinCount ?? undefined,
  }
}

const createBillService = (endpoint: string) => ({
  getAll: async (params: {
    companyId: string
    fromDate: string
    toDate: string
    departmentId?: string
    employeeType?: string
    searchTerm?: string
  }): Promise<BillResponseDto> => {
    const response = await api.get<unknown>(platformApiUrl(`/api/v1/${endpoint}`), {
      params: {
        companyId: params.companyId,
        fromDate: params.fromDate,
        toDate: params.toDate,
        departmentId: params.departmentId,
        employeeType: params.employeeType && params.employeeType !== "all" ? params.employeeType : undefined,
        searchTerm: params.searchTerm,
      },
    })
    const raw = unwrapResponse<{
      summary: BillSummaryDto
      records: BillDto[]
    }>(response)
    return {
      summary: raw.summary,
      records: (raw.records ?? []).map(mapRecord),
    }
  },
  process: async (data: {
    companyId: string
    fromDate: string
    toDate: string
    departmentId?: string
    employeeType?: string
    searchTerm?: string
  }) => {
    const response = await api.post<unknown>(platformApiUrl(`/api/v1/${endpoint}/process`), {
      companyId: data.companyId,
      fromDate: data.fromDate,
      toDate: data.toDate,
      departmentId: data.departmentId || null,
      employeeType: data.employeeType && data.employeeType !== "all" ? data.employeeType : null,
      searchTerm: data.searchTerm || null,
    })
    return unwrapResponse<number>(response)
  },
  delete: async (id: number) => {
    const response = await api.delete<unknown>(platformApiUrl(`/api/v1/${endpoint}/${id}`))
    return unwrapResponse<boolean>(response)
  },
  deleteMultiple: async (ids: number[]) => {
    const response = await api.post<unknown>(platformApiUrl(`/api/v1/${endpoint}/delete-multiple`), { ids })
    return unwrapResponse<number>(response)
  },
  export: async (params: {
    companyId: string
    fromDate: string
    toDate: string
    departmentId?: string
    employeeType?: string
    searchTerm?: string
  }) => {
    const response = await api.get(platformApiUrl(`/api/v1/${endpoint}/export`), {
      params: {
        companyId: params.companyId,
        fromDate: params.fromDate,
        toDate: params.toDate,
        departmentId: params.departmentId,
        employeeType: params.employeeType && params.employeeType !== "all" ? params.employeeType : undefined,
        searchTerm: params.searchTerm,
      },
      responseType: "blob",
    })
    downloadBlob(response.data, `${endpoint}_${new Date().toISOString().split("T")[0]}.csv`, "text/csv")
  },
  exportFormatted: async (
    params: {
      companyId: string
      fromDate: string
      toDate: string
      departmentId?: string
      employeeType?: string
      searchTerm?: string
    },
    format: "xlsx" | "pdf",
    filePrefix?: string,
  ) => {
    const response = await api.get(platformApiUrl(`/api/v1/${endpoint}/export.${format}`), {
      params: {
        companyId: params.companyId,
        fromDate: params.fromDate,
        toDate: params.toDate,
        departmentId: params.departmentId,
        employeeType: params.employeeType && params.employeeType !== "all" ? params.employeeType : undefined,
        searchTerm: params.searchTerm,
      },
      responseType: "blob",
    })
    const prefix = filePrefix ?? endpoint.replace(/-bills$/, "-bill")
    downloadBlob(
      response.data,
      `${prefix}.${format}`,
      format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
  },
})

export const nightBillService = createBillService("night-bills")
export const tiffinBillService = createBillService("tiffin-bills")
export const ifterBillService = createBillService("ifter-bills")
export const holidayBillService = createBillService("holiday-bills")
