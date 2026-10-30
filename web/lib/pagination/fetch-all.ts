import type { LegacyPagedResult } from "@/lib/pagination/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/types";

/**
 * When getAll was requested but the API returned only one page of rows,
 * load remaining server pages and merge into a single in-memory list.
 */
export async function ensureFullPageItems<T>(
  page: LegacyPagedResult<T>,
  fetchPage: (page: number, pageSize: number) => Promise<LegacyPagedResult<T>>,
): Promise<LegacyPagedResult<T>> {
  const total = page.totalCount ?? page.items.length;
  if (total <= page.items.length || page.totalPages <= 1) {
    return { ...page, getAll: true };
  }

  const pageSize =
    page.pageSize > 0 ? page.pageSize : DEFAULT_PAGE_SIZE;
  const merged = [...page.items];

  for (let p = 2; p <= page.totalPages; p++) {
    const next = await fetchPage(p, pageSize);
    merged.push(...next.items);
    if (merged.length >= total) break;
  }

  const displayPageSize = DEFAULT_PAGE_SIZE;
  const totalPages =
    total === 0 ? 0 : Math.ceil(total / displayPageSize);

  return {
    ...page,
    items: merged,
    page: 1,
    pageSize: displayPageSize,
    totalCount: total,
    totalPages,
    getAll: true,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}
