export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  getAll: boolean;
}

export interface PaginatedApiResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/** Legacy shape used by existing pages and services. */
export interface LegacyPagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  getAll?: boolean;
}

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
