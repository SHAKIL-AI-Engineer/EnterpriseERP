import api from "../api";
import { isValidCompanyGuid } from "@/lib/company-id";
import { unwrapApiData } from "@/lib/api-response";

const ORG = "Organogram";

/** Organogram list endpoints may return `T[]` or a paged `{ items: T[] }` like other APIs. */
function asArray<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object" && data !== null && "items" in data) {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

/** Matches `company.ts` — synthetic int for legacy selects keyed by numeric id. */
function stableIntFromGuid(guid: string): number {
  const hex = guid.replace(/-/g, "").slice(0, 8);
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? n | 0 : 0;
}

interface CompanySummaryRow {
  id: string;
  companyNameEn: string;
}

async function listCompanySummaries(): Promise<CompanySummaryRow[]> {
  const response = await api.get<unknown>("companies", {
    params: { Page: 1, PageSize: 50 },
  });
  const page = unwrapApiData<{ items: CompanySummaryRow[] }>(response.data);
  return page.items ?? [];
}

async function companyGuidFromLegacyCompanyId(companyId: number): Promise<string | undefined> {
  const rows = await listCompanySummaries();
  return rows.find((c) => stableIntFromGuid(c.id) === companyId)?.id;
}

async function resolveCompanyGuidParam(companyId: number | string): Promise<string | undefined> {
  const text = String(companyId).trim();
  if (!text || text.toLowerCase() === "all") {
    return undefined;
  }
  if (isValidCompanyGuid(text)) {
    return text;
  }
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return undefined;
  }
  return companyGuidFromLegacyCompanyId(numeric);
}

interface DepartmentApi {
  id: string;
  companyId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

interface SectionApi {
  id: string;
  departmentId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

interface DesignationApi {
  id: string;
  sectionId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

interface LineApi {
  id: string;
  sectionId: string;
  nameEn: string;
  nameBn: string;
  code: string | null;
}

export interface Department {
  id: number;
  entityId: string;
  companyId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  companyName?: string;
}

export interface Section {
  id: number;
  entityId: string;
  departmentId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  departmentName?: string;
  companyName?: string;
  companyId?: string;
}

export interface Designation {
  id: number;
  entityId: string;
  sectionId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  sectionName?: string;
  departmentName?: string;
  companyName?: string;
  nightBill?: number;
  holidayBill?: number;
  attendanceBonus?: number;
  isNightBillEligible?: boolean;
  isStaff?: boolean;
}

export interface Line {
  id: number;
  entityId: string;
  sectionId: string;
  nameEn: string;
  nameBn?: string;
  code?: string;
  sectionName?: string;
  departmentName?: string;
  companyName?: string;
}

export interface Shift {
  id: number;
  entityId: string;
  nameEn: string;
  nameBn?: string;
  inTime: string;
  outTime: string;
  lateInTime?: string;
  lunchTimeStart?: string;
  lunchHour: number;
  weekends?: string;
  companyId?: number;
  companyName?: string;
  status: string;
}

interface ShiftApi {
  id: string;
  companyId: string;
  shiftName: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  isCrossDay: boolean;
  isGeneralDuty: boolean;
  isDefault: boolean;
  isActive: boolean;
}

function mapShift(row: ShiftApi, companyName?: string): Shift {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    nameEn: row.shiftName,
    nameBn: undefined,
    inTime: row.startTime,
    outTime: row.endTime,
    lunchHour: 1,
    companyId: stableIntFromGuid(row.companyId),
    companyName,
    status: row.isActive ? "Active" : "Inactive",
  };
}

export async function resolveShiftGuid(
  shiftId: string | number,
  companyId: number,
): Promise<string | undefined> {
  if (typeof shiftId === "string" && shiftId.includes("-")) {
    return shiftId;
  }
  const n = typeof shiftId === "string" ? parseInt(shiftId, 10) : shiftId;
  if (!Number.isFinite(n)) return undefined;
  const all = await organogramService.getShifts({ companyId });
  return all.find((s) => s.id === n)?.entityId;
}

interface GroupApi {
  id: string;
  companyId: string;
  nameEn: string;
  nameBn: string;
}

interface FloorApi {
  id: string;
  companyId: string;
  nameEn: string;
  nameBn: string;
}

export interface Group {
  id: number;
  entityId: string;
  nameEn: string;
  nameBn?: string;
  companyId?: number;
  companyName?: string;
}

export interface Floor {
  id: number;
  entityId: string;
  nameEn: string;
  nameBn?: string;
  companyId?: number;
  companyName?: string;
}

function mapGroup(row: GroupApi, companyName?: string): Group {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    companyId: stableIntFromGuid(row.companyId),
    companyName,
  };
}

function mapFloor(row: FloorApi, companyName?: string): Floor {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    companyId: stableIntFromGuid(row.companyId),
    companyName,
  };
}

async function fetchGroupsInternal(companyGuid?: string): Promise<Group[]> {
  const params = companyGuid ? { companyId: companyGuid } : undefined;
  const response = await api.get<unknown>(`${ORG}/groups`, { params });
  const rows = asArray<GroupApi>(unwrapApiData<unknown>(response.data));
  const companies = await listCompanySummaries();
  return rows.map((r) => {
    const company = companies.find((c) => c.id === r.companyId);
    return mapGroup(r, company?.companyNameEn);
  });
}

async function fetchFloorsInternal(companyGuid?: string): Promise<Floor[]> {
  const params = companyGuid ? { companyId: companyGuid } : undefined;
  const response = await api.get<unknown>(`${ORG}/floors`, { params });
  const rows = asArray<FloorApi>(unwrapApiData<unknown>(response.data));
  const companies = await listCompanySummaries();
  return rows.map((r) => {
    const company = companies.find((c) => c.id === r.companyId);
    return mapFloor(r, company?.companyNameEn);
  });
}

async function resolveGroupEntityId(
  legacyId: number,
  companyId?: number,
): Promise<string | undefined> {
  const companyGuid =
    companyId !== undefined ? await companyGuidFromLegacyCompanyId(companyId) : undefined;
  const groups = await fetchGroupsInternal(companyGuid);
  return groups.find((g) => g.id === legacyId)?.entityId;
}

async function resolveFloorEntityId(legacyId: number): Promise<string | undefined> {
  const floors = await fetchFloorsInternal();
  return floors.find((f) => f.id === legacyId)?.entityId;
}

function mapDepartment(row: DepartmentApi, companyName?: string): Department {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    companyId: row.companyId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    companyName,
  };
}

function mapSection(
  row: SectionApi,
  extras?: { departmentName?: string; companyName?: string; companyId?: string },
): Section {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    departmentId: row.departmentId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    ...extras,
  };
}

function mapDesignation(row: DesignationApi, extras?: Partial<Designation>): Designation {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    sectionId: row.sectionId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    ...extras,
  };
}

function mapLine(row: LineApi, extras?: Partial<Line>): Line {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    sectionId: row.sectionId,
    nameEn: row.nameEn,
    nameBn: row.nameBn || undefined,
    code: row.code ?? undefined,
    ...extras,
  };
}

async function fetchDepartmentsForCompany(companyGuid: string, companyName?: string): Promise<Department[]> {
  const response = await api.get<unknown>(
    `${ORG}/companies/${encodeURIComponent(companyGuid)}/departments`,
  );
  const rows = asArray<DepartmentApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapDepartment(r, companyName));
}

async function fetchSectionsForDepartment(
  departmentGuid: string,
  extras?: { departmentName?: string; companyName?: string; companyId?: string },
): Promise<Section[]> {
  const response = await api.get<unknown>(
    `${ORG}/departments/${encodeURIComponent(departmentGuid)}/sections`,
  );
  const rows = asArray<SectionApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapSection(r, extras));
}

async function fetchDesignationsForSection(
  sectionGuid: string,
  extras?: Partial<Designation>,
): Promise<Designation[]> {
  const response = await api.get<unknown>(
    `${ORG}/sections/${encodeURIComponent(sectionGuid)}/designations`,
  );
  const rows = asArray<DesignationApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapDesignation(r, extras));
}

async function fetchLinesForSection(sectionGuid: string, extras?: Partial<Line>): Promise<Line[]> {
  const response = await api.get<unknown>(`${ORG}/sections/${encodeURIComponent(sectionGuid)}/lines`);
  const rows = asArray<LineApi>(unwrapApiData<unknown>(response.data));
  return rows.map((r) => mapLine(r, extras));
}

/** All sections (all companies) — avoids referencing `organogramService` before init. */
async function fetchAllSectionsInternal(): Promise<Section[]> {
  const depts = await allDepartmentsCached();
  const nested = await Promise.all(
    depts.map((d) =>
      fetchSectionsForDepartment(d.entityId, {
        departmentName: d.nameEn,
        companyName: d.companyName,
        companyId: d.companyId,
      }),
    ),
  );
  return nested.flat();
}

async function allDepartmentsCached(): Promise<Department[]> {
  const companies = await listCompanySummaries();
  const nested = await Promise.all(
    companies.map((c) => fetchDepartmentsForCompany(c.id, c.companyNameEn)),
  );
  return nested.flat();
}

export async function resolveDepartmentGuid(departmentId: string | number): Promise<string | undefined> {
  if (typeof departmentId === "string" && departmentId.includes("-")) {
    return departmentId;
  }
  const n = typeof departmentId === "string" ? parseInt(departmentId, 10) : departmentId;
  if (!Number.isFinite(n)) return undefined;
  const all = await allDepartmentsCached();
  return all.find((d) => d.id === n)?.entityId;
}

export async function resolveSectionGuid(sectionId: string | number): Promise<string | undefined> {
  if (typeof sectionId === "string" && sectionId.includes("-")) {
    return sectionId;
  }
  const n = typeof sectionId === "string" ? parseInt(sectionId, 10) : sectionId;
  if (!Number.isFinite(n)) return undefined;
  const allSections = await fetchAllSectionsInternal();
  return allSections.find((s) => s.id === n)?.entityId;
}

export async function resolveDesignationGuid(
  designationId: string | number,
): Promise<string | undefined> {
  if (typeof designationId === "string" && designationId.includes("-")) {
    return designationId;
  }
  const n = typeof designationId === "string" ? parseInt(designationId, 10) : designationId;
  if (!Number.isFinite(n)) return undefined;
  const all = await organogramService.getDesignations();
  return all.find((d) => d.id === n)?.entityId;
}
export async function resolveGroupGuid(
  groupId: string | number,
  companyId?: number,
): Promise<string | undefined> {
  if (typeof groupId === "string" && groupId.includes("-")) {
    return groupId;
  }
  const n = typeof groupId === "string" ? parseInt(groupId, 10) : groupId;
  if (!Number.isFinite(n)) return undefined;
  return resolveGroupEntityId(n, companyId);
}

/** Load departments + sections for filter dropdowns (e.g. Company Organogram). */
export async function loadOrganogramLookup(
  companies: { entityId: string; companyNameEn: string }[],
): Promise<{ departments: Department[]; sections: Section[] }> {
  if (!companies.length) return { departments: [], sections: [] };
  const departments = (
    await Promise.all(
      companies.map((c) => fetchDepartmentsForCompany(c.entityId, c.companyNameEn)),
    )
  ).flat();
  const sections = (
    await Promise.all(
      departments.map((d) =>
        fetchSectionsForDepartment(d.entityId, {
          departmentName: d.nameEn,
          companyName: d.companyName,
          companyId: d.companyId,
        }),
      ),
    )
  ).flat();
  return { departments, sections };
}

export const organogramService = {
  getDepartments: async (filters?: { companyId?: string | number }): Promise<Department[]> => {
    if (filters?.companyId === undefined) {
      return allDepartmentsCached();
    }
    const guid = await resolveCompanyGuidParam(filters.companyId);
    if (!guid) return [];
    const row = (await listCompanySummaries()).find((c) => c.id === guid);
    return fetchDepartmentsForCompany(guid, row?.companyNameEn);
  },

  createDepartment: async (data: { nameEn: string; nameBn?: string; companyId: string; code?: string | null }) => {
    const body = {
      id: null as string | null,
      companyId: data.companyId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/departments`, body);
    return unwrapApiData<string>(response.data);
  },

  updateDepartment: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; companyId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      companyId: data.companyId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/departments`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteDepartment: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/departments/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getSections: async (filters?: { companyId?: number; departmentId?: string | number }): Promise<Section[]> => {
    void filters?.companyId;
    if (filters?.departmentId === undefined) {
      return fetchAllSectionsInternal();
    }
    const guid = await resolveDepartmentGuid(filters.departmentId);
    if (!guid) return [];
    const d = (await allDepartmentsCached()).find((x) => x.entityId === guid);
    return fetchSectionsForDepartment(guid, {
      departmentName: d?.nameEn,
      companyName: d?.companyName,
      companyId: d?.companyId,
    });
  },

  createSection: async (data: {
    nameEn: string;
    nameBn?: string;
    departmentId: string;
    code?: string | null;
  }) => {
    const body = {
      id: null as string | null,
      departmentId: data.departmentId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/sections`, body);
    return unwrapApiData<string>(response.data);
  },

  updateSection: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; departmentId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      departmentId: data.departmentId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/sections`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteSection: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/sections/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getDesignations: async (filters?: {
    companyId?: number;
    departmentId?: string | number;
    sectionId?: string | number;
  }): Promise<Designation[]> => {
    void filters?.companyId;
    void filters?.departmentId;
    if (filters?.sectionId === undefined) {
      const sections = await fetchAllSectionsInternal();
      const nested = await Promise.all(
        sections.map((s) =>
          fetchDesignationsForSection(s.entityId, {
            sectionName: s.nameEn,
            departmentName: s.departmentName,
            companyName: s.companyName,
          }),
        ),
      );
      return nested.flat();
    }
    const guid = await resolveSectionGuid(filters.sectionId);
    if (!guid) return [];
    const s = (await fetchAllSectionsInternal()).find((x) => x.entityId === guid);
    return fetchDesignationsForSection(guid, {
      sectionName: s?.nameEn,
      departmentName: s?.departmentName,
      companyName: s?.companyName,
    });
  },

  createDesignation: async (data: {
    nameEn: string;
    nameBn?: string;
    sectionId: string;
    code?: string | null;
  }) => {
    const body = {
      id: null as string | null,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/designations`, body);
    return unwrapApiData<string>(response.data);
  },

  updateDesignation: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; sectionId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/designations`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteDesignation: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/designations/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getLines: async (filters?: {
    companyId?: number;
    departmentId?: string | number;
    sectionId?: string | number;
  }): Promise<Line[]> => {
    void filters?.companyId;
    void filters?.departmentId;
    if (filters?.sectionId === undefined) {
      const sections = await fetchAllSectionsInternal();
      const nested = await Promise.all(
        sections.map((s) =>
          fetchLinesForSection(s.entityId, {
            sectionName: s.nameEn,
            departmentName: s.departmentName,
            companyName: s.companyName,
          }),
        ),
      );
      return nested.flat();
    }
    const guid = await resolveSectionGuid(filters.sectionId);
    if (!guid) return [];
    const s = (await fetchAllSectionsInternal()).find((x) => x.entityId === guid);
    return fetchLinesForSection(guid, {
      sectionName: s?.nameEn,
      departmentName: s?.departmentName,
      companyName: s?.companyName,
    });
  },

  createLine: async (data: { nameEn: string; nameBn?: string; sectionId: string; code?: string | null }) => {
    const body = {
      id: null as string | null,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.post<unknown>(`${ORG}/lines`, body);
    return unwrapApiData<string>(response.data);
  },

  updateLine: async (
    entityId: string,
    data: { nameEn: string; nameBn?: string; sectionId: string; code?: string | null },
  ) => {
    const body = {
      id: entityId,
      sectionId: data.sectionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code ?? null,
    };
    const response = await api.put<unknown>(`${ORG}/lines`, body);
    return unwrapApiData<string>(response.data);
  },

  deleteLine: async (entityId: string) => {
    const response = await api.delete<unknown>(`${ORG}/lines/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getShifts: async (params?: { companyName?: string; companyId?: number }) => {
    let companyGuid: string | undefined;
    let companyName = params?.companyName;
    const companies = await listCompanySummaries();
    if (params?.companyId !== undefined) {
      const match = companies.find((c) => stableIntFromGuid(c.id) === params.companyId);
      companyGuid = match?.id;
      companyName = companyName ?? match?.companyNameEn;
    } else {
      companyGuid = companies[0]?.id;
      companyName = companyName ?? companies[0]?.companyNameEn;
    }
    if (!companyGuid) return [];
    try {
      const response = await api.get<unknown>("Shifts", { params: { companyId: companyGuid } });
      const rawRows = asArray<ShiftApi>(unwrapApiData<unknown>(response.data));
      return rawRows.map((r) => mapShift(r, companyName));
    } catch {
      return [];
    }
  },
  getShift: async (id: number) => {
    const response = await api.get<Shift>(`/shift/${id}`);
    return response.data;
  },
  createShift: async (data: {
    nameEn: string;
    nameBn?: string;
    inTime: string;
    outTime: string;
    lateLimit: number;
  }) => {
    const response = await api.post<Shift>("/shift", data);
    return response.data;
  },
  updateShift: async (
    id: number,
    data: { nameEn: string; nameBn?: string; inTime: string; outTime: string; lateLimit: number },
  ) => {
    const response = await api.put<Shift>(`/shift/${id}`, data);
    return response.data;
  },
  deleteShift: async (id: number) => {
    const response = await api.delete(`/shift/${id}`);
    return response.data;
  },

  getGroups: async (params?: { companyName?: string; companyId?: number | string }) => {
    void params?.companyName;
    let companyGuid: string | undefined;
    if (params?.companyId !== undefined) {
      companyGuid = await resolveCompanyGuidParam(params.companyId);
      if (!companyGuid) return [];
    }
    return fetchGroupsInternal(companyGuid);
  },
  createGroup: async (data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    void data.companyName;
    const companyGuid = await companyGuidFromLegacyCompanyId(data.companyId);
    if (!companyGuid) throw new Error("Company not found");
    const body = {
      id: null as string | null,
      companyId: companyGuid,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ORG}/groups`, body);
    return unwrapApiData<string>(response.data);
  },
  updateGroup: async (id: number, data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    void data.companyName;
    const entityId = await resolveGroupEntityId(id);
    if (!entityId) throw new Error("Group not found");
    const companyGuid = await companyGuidFromLegacyCompanyId(data.companyId);
    if (!companyGuid) throw new Error("Company not found");
    const body = {
      id: entityId,
      companyId: companyGuid,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.put<unknown>(`${ORG}/groups`, body);
    return unwrapApiData<string>(response.data);
  },
  deleteGroup: async (id: number) => {
    const entityId = await resolveGroupEntityId(id);
    if (!entityId) throw new Error("Group not found");
    const response = await api.delete<unknown>(`${ORG}/groups/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

  getFloors: async (params?: { companyName?: string; companyId?: number | string }) => {
    void params?.companyName;
    let companyGuid: string | undefined;
    if (params?.companyId !== undefined) {
      companyGuid = await resolveCompanyGuidParam(params.companyId);
      if (!companyGuid) return [];
    }
    return fetchFloorsInternal(companyGuid);
  },
  createFloor: async (data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    void data.companyName;
    const companyGuid = await companyGuidFromLegacyCompanyId(data.companyId);
    if (!companyGuid) throw new Error("Company not found");
    const body = {
      id: null as string | null,
      companyId: companyGuid,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ORG}/floors`, body);
    return unwrapApiData<string>(response.data);
  },
  updateFloor: async (id: number, data: { nameEn: string; nameBn?: string; companyId: number; companyName?: string }) => {
    void data.companyName;
    const entityId = await resolveFloorEntityId(id);
    if (!entityId) throw new Error("Floor not found");
    const companyGuid = await companyGuidFromLegacyCompanyId(data.companyId);
    if (!companyGuid) throw new Error("Company not found");
    const body = {
      id: entityId,
      companyId: companyGuid,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.put<unknown>(`${ORG}/floors`, body);
    return unwrapApiData<string>(response.data);
  },
  deleteFloor: async (id: number) => {
    const entityId = await resolveFloorEntityId(id);
    if (!entityId) throw new Error("Floor not found");
    const response = await api.delete<unknown>(`${ORG}/floors/${encodeURIComponent(entityId)}`);
    return unwrapApiData<string>(response.data);
  },

};

export type { ImportResult } from "@/lib/services/import-export";
