import { AxiosResponse } from "axios";
import { getPublicApiOrigin } from "@/lib/api-base";
import { unwrapApiData } from "@/lib/api-response";

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export function platformApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicApiOrigin()}${normalized}`;
}

export function unwrapResponse<T>(response: AxiosResponse<unknown>): T {
  return unwrapApiData<T>(response.data);
}

export function downloadBlob(data: BlobPart, fileName: string, type?: string): void {
  const blob = data instanceof Blob ? data : new Blob([data], type ? { type } : undefined);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
