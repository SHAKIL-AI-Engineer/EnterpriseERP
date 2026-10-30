import type { ApiEnvelope } from "@/lib/api-response";
import type { PaginatedApiResult, PaginationMeta } from "@/lib/pagination/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/types";

function readPagination(raw: Record<string, unknown>): PaginationMeta {
  const p =
    (raw.pagination as Record<string, unknown> | undefined) ??
    (raw.Pagination as Record<string, unknown> | undefined) ??
    {};

  const page = Number(p.page ?? p.Page ?? 1);
  const pageSize = Number(p.pageSize ?? p.PageSize ?? DEFAULT_PAGE_SIZE);
  const totalCount = Number(p.totalCount ?? p.TotalCount ?? 0);
  const totalPages = Number(
    p.totalPages ?? p.TotalPages ?? (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0),
  );

  return {
    page: page < 1 ? 1 : page,
    pageSize: pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize,
    totalCount,
    totalPages,
    hasNextPage: Boolean(p.hasNextPage ?? p.HasNextPage ?? page < totalPages),
    hasPreviousPage: Boolean(p.hasPreviousPage ?? p.HasPreviousPage ?? page > 1),
    getAll: Boolean(p.getAll ?? p.GetAll ?? false),
  };
}

/** Supports PaginatedApiResponse, nested legacy PagedResult, or raw arrays. */
export function unwrapPaginatedApiData<T>(body: unknown): PaginatedApiResult<T> {
  const envelope = body as ApiEnvelope<unknown> & Record<string, unknown>;
  if (!envelope || typeof envelope !== "object") {
    throw new Error("Invalid paginated API response");
  }

  const success =
    typeof envelope.success === "boolean"
      ? envelope.success
      : typeof (envelope as Record<string, unknown>).Success === "boolean"
        ? ((envelope as Record<string, unknown>).Success as boolean)
        : undefined;
  if (success === false) {
    throw new Error("Request failed");
  }

  const topLevelData = envelope.data ?? (envelope as Record<string, unknown>).Data;
  if (Array.isArray(topLevelData)) {
    return {
      data: topLevelData as T[],
      pagination: readPagination(envelope as Record<string, unknown>),
    };
  }

  const raw = topLevelData as Record<string, unknown> | undefined;

  if (raw && typeof raw === "object") {
    const record = raw;

    if (Array.isArray(record.data) || Array.isArray(record.Data)) {
      const data = (record.data ?? record.Data) as T[];
      const pagination = readPagination({
        ...envelope,
        pagination: record.pagination ?? record.Pagination,
      });
      return { data, pagination };
    }

    const items = (record.items ?? record.Items) as T[] | undefined;
    if (items) {
      const page = Number(record.page ?? record.Page ?? 1);
      const pageSize = Number(record.pageSize ?? record.PageSize ?? DEFAULT_PAGE_SIZE);
      const totalCount = Number(record.totalCount ?? record.TotalCount ?? items.length);
      const totalPages = Number(
        record.totalPages ??
          record.TotalPages ??
          (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0),
      );
      return {
        data: items,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          getAll: Boolean(record.getAll ?? record.GetAll ?? pageSize === 0),
        },
      };
    }
  }

  throw new Error("Invalid paginated API response");
}

export function toLegacyPagedResult<T>(result: PaginatedApiResult<T>) {
  return {
    items: result.data,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalCount: result.pagination.totalCount,
    totalPages: result.pagination.totalPages,
    hasNextPage: result.pagination.hasNextPage,
    hasPreviousPage: result.pagination.hasPreviousPage,
    getAll: result.pagination.getAll,
  };
}
