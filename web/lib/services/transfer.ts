import { employeeService } from "@/lib/services/employee";
import type { HrTransferItem } from "@/lib/services/hr-types";
import type { LegacyPagedResult } from "@/lib/pagination/types";
import { organogramService } from "@/lib/services/organogram";

export interface Transfer {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  fromDepartmentId?: string;
  fromDepartmentName?: string;
  fromDesignationName?: string;
  toDepartmentId?: string;
  toDepartmentName?: string;
  toDesignationName?: string;
  transferDate: string;
  reason: string;
  createdAt: string;
}

export interface CreateTransferDto {
  employeeEntityId: string;
  toDepartmentId: number;
  toDesignationId: number;
  transferDate: string;
  reason: string;
  companyId?: number;
}

function mapHrTransfer(row: HrTransferItem): Transfer {
  const entityId = row.employeeEntityId ?? row.employeeId ?? "";
  const code = row.employeeCode ?? row.employeeID ?? "";
  return {
    id: row.id,
    employeeId: entityId,
    employeeName: row.fullName,
    employeeCode: code,
    fromDepartmentId: row.fromDepartmentId ?? undefined,
    fromDepartmentName: row.fromDepartmentName ?? undefined,
    toDepartmentId: row.toDepartmentId ?? undefined,
    toDepartmentName: row.toDepartmentName ?? undefined,
    transferDate: row.effectiveDate,
    reason: row.reason ?? "",
    createdAt: row.createdAt,
  };
}

export type TransferPage = LegacyPagedResult<Transfer>;

export const transferService = {
  getTransfersPage: async (params?: {
    companyId?: number;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
    getAll?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<TransferPage> => {
    const page = await employeeService.listTransfers({
      companyId: params?.companyId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      page: params?.page,
      pageSize: params?.pageSize,
      getAll: params?.getAll,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });
    return {
      ...page,
      items: (page.items ?? []).map(mapHrTransfer),
    };
  },

  getTransfers: async (params?: {
    companyId?: number;
    fromDate?: string;
    toDate?: string;
  }) => {
    const page = await transferService.getTransfersPage({
      ...params,
      getAll: true,
    });
    return page.items;
  },

  createTransfer: async (data: CreateTransferDto) => {
    await employeeService.transferEmployee(data.employeeEntityId, {
      departmentId: data.toDepartmentId,
      designationId: data.toDesignationId,
      effectiveFrom: data.transferDate,
      reason: data.reason,
      companyId: data.companyId,
    });

    const profile = await employeeService.getEmployee(
      data.employeeEntityId,
      data.companyId ?? 0,
    );
    const [departments, designations] = await Promise.all([
      organogramService.getDepartments(),
      organogramService.getDesignations({ departmentId: data.toDepartmentId }),
    ]);
    const toDepartment = departments.find((d) => d.id === data.toDepartmentId);
    const toDesignation = designations.find(
      (d) => d.id === data.toDesignationId,
    );

    return {
      id: crypto.randomUUID(),
      employeeId: profile.entityId ?? data.employeeEntityId,
      employeeName: profile.fullNameEn,
      employeeCode: profile.employeeId,
      fromDepartmentName: profile.departmentName,
      fromDesignationName: profile.designationName,
      toDepartmentId: String(data.toDepartmentId),
      toDepartmentName: toDepartment?.nameEn,
      toDesignationName: toDesignation?.nameEn,
      transferDate: data.transferDate,
      reason: data.reason,
      createdAt: new Date().toISOString(),
    };
  },
};
