import axios from "axios";
import api from "../api";
import { unwrapApiData } from "@/lib/api-response";

/** Matches Swagger: `/api/v1/Addresses/...` (capital A, plural). */
const ADDR = "Addresses";

export type EntityId = string;

/** Use filter dropdown values (skip `"all"`). */
export function parseOptionalEntityId(value: string): string | undefined {
  if (!value || value === "all") return undefined;
  return value;
}

function asArray<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object" && data !== null && "items" in data) {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

function parseList<T>(responseData: unknown): T[] {
  const raw = unwrapApiData<unknown>(responseData);
  return asArray<T>(raw);
}

function idPath(id: EntityId): string {
  return encodeURIComponent(String(id));
}

function is404(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 404;
}

/** Unwrap mutation responses; tolerate empty 204 bodies. */
function writeMutation(responseData: unknown): unknown {
  if (responseData === undefined || responseData === null || responseData === "") {
    return undefined;
  }
  return unwrapApiData<unknown>(responseData);
}

export interface Country {
  id: EntityId;
  nameEn: string;
  nameBn?: string;
  code: string;
}

export interface Division {
  id: EntityId;
  nameEn: string;
  nameBn?: string;
  countryId: EntityId;
  countryName?: string;
}

export interface District {
  id: EntityId;
  nameEn: string;
  nameBn?: string;
  divisionId: EntityId;
  divisionName?: string;
}

/** UI label "Thana"; API resource is `upazilas`. */
export interface Thana {
  id: EntityId;
  nameEn: string;
  nameBn?: string;
  districtId: EntityId;
  districtName?: string;
}

export interface PostOffice {
  id: EntityId;
  nameEn: string;
  nameBn?: string;
  postalCode: string;
  upazilaId: EntityId;
  upazilaName?: string;
  /** @deprecated use postalCode */
  code?: string;
  districtId?: EntityId;
  districtName?: string;
}

export interface BangladeshAddressDirectoryRow {
  id: EntityId;
  countryId: EntityId;
  countryNameEn: string;
  countryNameBn: string;
  countryCode: string;
  divisionId: EntityId;
  divisionNameEn: string;
  divisionNameBn: string;
  districtId: EntityId;
  districtNameEn: string;
  districtNameBn: string;
  upazilaId: EntityId;
  upazilaNameEn: string;
  upazilaNameBn: string;
  postOfficeId: EntityId;
  postOfficeNameEn: string;
  postOfficeNameBn: string;
  postalCode: string;
}

async function getDivisionsForCountry(countryId: EntityId): Promise<Division[]> {
  const response = await api.get<unknown>(`${ADDR}/countries/${idPath(countryId)}/divisions`);
  return parseList<Division>(response.data);
}

async function getDistrictsForDivision(divisionId: EntityId): Promise<District[]> {
  const response = await api.get<unknown>(`${ADDR}/divisions/${idPath(divisionId)}/districts`);
  return parseList<District>(response.data);
}

async function getUpazilasForDistrict(districtId: EntityId): Promise<Thana[]> {
  const response = await api.get<unknown>(`${ADDR}/districts/${idPath(districtId)}/upazilas`);
  return parseList<Thana>(response.data);
}

async function getPostOfficesForUpazila(upazilaId: EntityId): Promise<PostOffice[]> {
  const response = await api.get<unknown>(`${ADDR}/upazilas/${idPath(upazilaId)}/post-offices`);
  return parseList<PostOffice>(response.data);
}

export const addressService = {
  getBangladeshDirectory: async (search?: string) => {
    const response = await api.get<unknown>(`${ADDR}/bangladesh/directory`, {
      params: search?.trim() ? { search: search.trim() } : undefined,
    });
    return parseList<Omit<BangladeshAddressDirectoryRow, "id"> & { postOfficeId: EntityId }>(response.data)
      .map((row) => ({ ...row, id: row.postOfficeId }));
  },
  getCountries: async () => {
    const response = await api.get<unknown>(`${ADDR}/countries`);
    return parseList<Country>(response.data);
  },
  createCountry: async (data: { nameEn: string; nameBn?: string; code: string }) => {
    const body = {
      id: null,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code,
    };
    const response = await api.post<unknown>(`${ADDR}/countries`, body);
    return writeMutation(response.data);
  },
  updateCountry: async (id: EntityId, data: { nameEn: string; nameBn?: string; code: string }) => {
    const response = await api.put<unknown>(`${ADDR}/countries`, {
      id,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      code: data.code,
    });
    return writeMutation(response.data);
  },
  deleteCountry: async (id: EntityId) => {
    const response = await api.delete<unknown>(`${ADDR}/countries/${idPath(id)}`);
    return writeMutation(response.data);
  },

  getDivisions: async (countryId?: EntityId) => {
    if (countryId) {
      const rows = await getDivisionsForCountry(countryId);
      const country = (await addressService.getCountries()).find((c) => c.id === countryId);
      return rows.map((d) => ({
        ...d,
        countryId: d.countryId ?? countryId,
        countryName: d.countryName ?? country?.nameEn,
      }));
    }
    const countries = await addressService.getCountries();
    const nested = await Promise.all(
      countries.map(async (c) => {
        const rows = await getDivisionsForCountry(c.id);
        return rows.map((d) => ({
          ...d,
          countryId: d.countryId ?? c.id,
          countryName: d.countryName ?? c.nameEn,
        }));
      }),
    );
    return nested.flat();
  },
  createDivision: async (data: { nameEn: string; nameBn?: string; countryId: EntityId }) => {
    const body = {
      id: null,
      countryId: data.countryId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ADDR}/divisions`, body);
    return writeMutation(response.data);
  },
  updateDivision: async (id: EntityId, data: { nameEn: string; nameBn?: string; countryId: EntityId }) => {
    const response = await api.put<unknown>(`${ADDR}/divisions`, {
      id,
      countryId: data.countryId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    });
    return writeMutation(response.data);
  },
  deleteDivision: async (id: EntityId) => {
    const response = await api.delete<unknown>(`${ADDR}/divisions/${idPath(id)}`);
    return writeMutation(response.data);
  },

  getDistricts: async (divisionId?: EntityId) => {
    if (divisionId) {
      const rows = await getDistrictsForDivision(divisionId);
      return rows.map((r) => ({
        ...r,
        divisionId: r.divisionId ?? divisionId,
      }));
    }
    const divisions = await addressService.getDivisions();
    const nested = await Promise.all(
      divisions.map(async (div) => {
        const rows = await getDistrictsForDivision(div.id);
        return rows.map((r) => ({
          ...r,
          divisionId: r.divisionId ?? div.id,
          divisionName: r.divisionName ?? div.nameEn,
        }));
      }),
    );
    return nested.flat();
  },
  createDistrict: async (data: { nameEn: string; nameBn?: string; divisionId: EntityId }) => {
    const body = {
      id: null,
      divisionId: data.divisionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ADDR}/districts`, body);
    return writeMutation(response.data);
  },
  updateDistrict: async (id: EntityId, data: { nameEn: string; nameBn?: string; divisionId: EntityId }) => {
    const response = await api.put<unknown>(`${ADDR}/districts`, {
      id,
      divisionId: data.divisionId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    });
    return writeMutation(response.data);
  },
  deleteDistrict: async (id: EntityId) => {
    const response = await api.delete<unknown>(`${ADDR}/districts/${idPath(id)}`);
    return writeMutation(response.data);
  },

  getThanas: async (districtId?: EntityId) => {
    if (districtId) {
      const rows = await getUpazilasForDistrict(districtId);
      return rows.map((t) => ({
        ...t,
        districtId: t.districtId ?? districtId,
      }));
    }
    const districts = await addressService.getDistricts();
    const nested = await Promise.all(
      districts.map(async (d) => {
        const rows = await getUpazilasForDistrict(d.id);
        return rows.map((t) => ({
          ...t,
          districtId: t.districtId ?? d.id,
          districtName: t.districtName ?? d.nameEn,
        }));
      }),
    );
    return nested.flat();
  },
  createThana: async (data: { nameEn: string; nameBn?: string; districtId: EntityId }) => {
    const body = {
      id: null,
      districtId: data.districtId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    };
    const response = await api.post<unknown>(`${ADDR}/upazilas`, body);
    return writeMutation(response.data);
  },
  updateThana: async (id: EntityId, data: { nameEn: string; nameBn?: string; districtId: EntityId }) => {
    const response = await api.put<unknown>(`${ADDR}/upazilas`, {
      id,
      districtId: data.districtId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
    });
    return writeMutation(response.data);
  },
  deleteThana: async (id: EntityId) => {
    const response = await api.delete<unknown>(`${ADDR}/upazilas/${idPath(id)}`);
    return writeMutation(response.data);
  },

  getPostOffices: async (filters?: { districtId?: EntityId; upazilaId?: EntityId }) => {
    if (filters?.upazilaId) {
      return getPostOfficesForUpazila(filters.upazilaId);
    }
    if (filters?.districtId) {
      const upazilas = await getUpazilasForDistrict(filters.districtId);
      const nested = await Promise.all(
        upazilas.map(async (u) => {
          const rows = await getPostOfficesForUpazila(u.id);
          return rows.map((po) => ({
            ...po,
            upazilaId: po.upazilaId ?? u.id,
            postalCode: po.postalCode ?? po.code ?? "",
          }));
        }),
      );
      return nested.flat();
    }
    const thanas = await addressService.getThanas();
    const nested = await Promise.all(
      thanas.map(async (t) => {
        const rows = await getPostOfficesForUpazila(t.id);
        return rows.map((po) => ({
          ...po,
          upazilaId: po.upazilaId ?? t.id,
          postalCode: po.postalCode ?? po.code ?? "",
        }));
      }),
    );
    return nested.flat();
  },

  createPostOffice: async (data: {
    nameEn: string;
    nameBn?: string;
    postalCode: string;
    upazilaId: EntityId;
  }) => {
    const body = {
      id: null,
      upazilaId: data.upazilaId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      postalCode: data.postalCode,
    };
    const response = await api.post<unknown>(`${ADDR}/post-offices`, body);
    return writeMutation(response.data);
  },
  updatePostOffice: async (
    id: EntityId,
    data: { nameEn: string; nameBn?: string; postalCode: string; upazilaId: EntityId },
  ) => {
    const response = await api.put<unknown>(`${ADDR}/post-offices`, {
      id,
      upazilaId: data.upazilaId,
      nameEn: data.nameEn,
      nameBn: data.nameBn ?? "",
      postalCode: data.postalCode,
    });
    return writeMutation(response.data);
  },
  deletePostOffice: async (id: EntityId) => {
    const response = await api.delete<unknown>(`${ADDR}/post-offices/${idPath(id)}`);
    return writeMutation(response.data);
  },

};
