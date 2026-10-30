import api from "../api";
import { unwrapApiData } from "@/lib/api-response";
import { companyService } from "@/lib/services/company";
import {
  organogramService,
  resolveDepartmentGuid,
  resolveDesignationGuid,
} from "@/lib/services/organogram";

function stableIntFromGuid(guid: string): number {
  const hex = guid.replace(/-/g, "").slice(0, 8);
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? n | 0 : 0;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface HrManpowerRequirement {
  id: string;
  companyId: string;
  departmentId: string;
  departmentName?: string | null;
  designationId: string;
  designationName?: string | null;
  requiredNumber: number;
  requestDate: string;
  expectedJoiningDate?: string | null;
  status: string;
  remarks?: string | null;
}

interface HrManpowerRequirementSummary {
  departmentId: string;
  departmentName?: string | null;
  designationId: string;
  designationName?: string | null;
  approvedCount: number;
  pendingCount: number;
  onboardCount: number;
  gapCount: number;
}

async function firstCompanyGuid(): Promise<string> {
  const company = (await companyService.getAll())[0];
  if (!company?.entityId)
    throw new Error("No company is available for manpower requirements.");
  return company.entityId;
}

async function companyGuidForDepartment(departmentId: number): Promise<string> {
  const department = (await organogramService.getDepartments()).find(
    (d) => d.id === departmentId,
  );
  return department?.companyId || (await firstCompanyGuid());
}

function summaryKey(departmentId: string, designationId: string): string {
  return `${departmentId}:${designationId}`;
}

async function fetchRequirementSummaries(
  companyIds: string[],
): Promise<Map<string, HrManpowerRequirementSummary>> {
  const map = new Map<string, HrManpowerRequirementSummary>();
  const uniqueCompanyIds = [...new Set(companyIds.filter(Boolean))];

  await Promise.all(
    uniqueCompanyIds.map(async (companyId) => {
      const response = await api.get<unknown>(
        "hr/ManpowerRequirements/summary",
        {
          params: { companyId },
        },
      );
      const rows =
        unwrapApiData<HrManpowerRequirementSummary[]>(response.data) ?? [];
      for (const row of rows) {
        map.set(summaryKey(row.departmentId, row.designationId), row);
      }
    }),
  );

  return map;
}

function mapRequirement(
  row: HrManpowerRequirement,
  summary?: HrManpowerRequirementSummary,
): ManpowerRequirement {
  const currentCount = summary?.onboardCount ?? 0;
  const gap = Math.max(0, row.requiredNumber - currentCount);

  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    companyEntityId: row.companyId,
    departmentId: stableIntFromGuid(row.departmentId),
    departmentEntityId: row.departmentId,
    departmentName: row.departmentName ?? "Unassigned",
    designationId: stableIntFromGuid(row.designationId),
    designationEntityId: row.designationId,
    designationName: row.designationName ?? "Unassigned",
    requiredCount: row.requiredNumber,
    currentCount,
    gap,
    note: row.remarks ?? undefined,
    status: row.status,
    createdAt: row.requestDate,
  };
}

async function resolveRequirementGuid(id: number): Promise<string> {
  const response = await api.get<unknown>("hr/ManpowerRequirements", {
    params: { page: 1, pageSize: 200 },
  });
  const page = unwrapApiData<PagedResult<HrManpowerRequirement>>(response.data);
  const match = (page.items ?? []).find((r) => stableIntFromGuid(r.id) === id);
  if (!match) throw new Error("Requirement not found.");
  return match.id;
}

export interface ManpowerRequirement {
  id: number;
  entityId?: string;
  companyEntityId?: string;
  departmentId: number;
  departmentEntityId?: string;
  departmentName: string;
  designationId: number;
  designationEntityId?: string;
  designationName: string;
  requiredCount: number;
  currentCount: number;
  gap: number;
  status?: string;
  note?: string;
  createdAt: string;
}

export interface CreateManpowerRequirementDto {
  departmentId: number;
  designationId: number;
  requiredCount: number;
  note?: string;
}

export const requirementService = {
  getRequirements: async (params?: {
    companyId?: number;
    departmentId?: number;
    status?: string;
  }) => {
    const companyGuid = params?.companyId
      ? (await companyService.getAll()).find((c) => c.id === params.companyId)
          ?.entityId
      : undefined;
    const departmentGuid = params?.departmentId
      ? await resolveDepartmentGuid(params.departmentId)
      : undefined;

    const response = await api.get<unknown>("hr/ManpowerRequirements", {
      params: {
        page: 1,
        pageSize: 200,
        companyId: companyGuid,
        departmentId: departmentGuid,
        status:
          params?.status && params.status.toLowerCase() !== "all"
            ? params.status
            : undefined,
      },
    });
    const page = unwrapApiData<PagedResult<HrManpowerRequirement>>(
      response.data,
    );
    const items = page.items ?? [];
    const summaries = await fetchRequirementSummaries(
      items.map((r) => r.companyId),
    );

    return items.map((row) =>
      mapRequirement(
        row,
        summaries.get(summaryKey(row.departmentId, row.designationId)),
      ),
    );
  },

  getRequirement: async (id: number) => {
    const entityId = await resolveRequirementGuid(id);
    const response = await api.get<unknown>(
      `hr/ManpowerRequirements/${encodeURIComponent(entityId)}`,
    );
    const row = unwrapApiData<HrManpowerRequirement>(response.data);
    const summaries = await fetchRequirementSummaries([row.companyId]);
    return mapRequirement(
      row,
      summaries.get(summaryKey(row.departmentId, row.designationId)),
    );
  },

  getSummary: async (companyId: number) => {
    const company = (await companyService.getAll()).find(
      (c) => c.id === companyId,
    );
    if (!company?.entityId) throw new Error("Company not found.");
    const response = await api.get<unknown>("hr/ManpowerRequirements/summary", {
      params: { companyId: company.entityId },
    });
    return unwrapApiData<HrManpowerRequirementSummary[]>(response.data) ?? [];
  },

  createRequirement: async (data: CreateManpowerRequirementDto) => {
    const companyId = await companyGuidForDepartment(data.departmentId);
    const departmentId = await resolveDepartmentGuid(data.departmentId);
    const designationId = await resolveDesignationGuid(data.designationId);
    if (!departmentId || !designationId) {
      throw new Error("Department and designation are required.");
    }
    const response = await api.post<unknown>("hr/ManpowerRequirements", {
      companyId,
      departmentId,
      designationId,
      requiredNumber: data.requiredCount,
      requestDate: new Date().toISOString(),
      expectedJoiningDate: null,
      remarks: data.note || null,
    });
    return unwrapApiData<string>(response.data);
  },

  updateRequirement: async (id: number, data: CreateManpowerRequirementDto) => {
    const entityId = await resolveRequirementGuid(id);
    const existing = await requirementService.getRequirement(id);
    const departmentId = await resolveDepartmentGuid(data.departmentId);
    const designationId = await resolveDesignationGuid(data.designationId);
    if (!departmentId || !designationId) {
      throw new Error("Department and designation are required.");
    }
    const response = await api.put<unknown>(
      `hr/ManpowerRequirements/${encodeURIComponent(entityId)}`,
      {
        departmentId,
        designationId,
        requiredNumber: data.requiredCount,
        requestDate: existing.createdAt || new Date().toISOString(),
        expectedJoiningDate: null,
        status: existing.status ?? "Pending",
        remarks: data.note || null,
      },
    );
    return unwrapApiData<string>(response.data);
  },

  deleteRequirement: async (id: number) => {
    const entityId = await resolveRequirementGuid(id);
    const response = await api.delete<unknown>(
      `hr/ManpowerRequirements/${encodeURIComponent(entityId)}`,
    );
    return unwrapApiData<string>(response.data);
  },
};
