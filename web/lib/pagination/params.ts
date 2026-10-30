import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/types";

export type SortOrder = "asc" | "desc";

export interface PaginationQueryInput {
  page?: number;
  pageSize?: number;
  getAll?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | number | boolean | undefined | null>;
}

export function buildPaginationParams(input: PaginationQueryInput = {}): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  const page = input.page && input.page > 0 ? input.page : 1;

  if (input.getAll) {
    params.page = 1;
    params.pageSize = DEFAULT_PAGE_SIZE;
    params.getAll = true;
    params.GetAll = true;
  } else {
    params.page = page;
    params.pageSize =
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE;
  }

  if (input.sortBy?.trim()) {
    params.sortBy = input.sortBy.trim();
  }
  if (input.sortOrder) {
    params.sortOrder = input.sortOrder;
  }

  if (input.filters) {
    for (const [key, value] of Object.entries(input.filters)) {
      if (value === undefined || value === null || value === "") continue;
      params[key] = value;
    }
  }

  return params;
}
