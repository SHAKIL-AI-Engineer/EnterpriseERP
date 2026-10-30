"use client";

import * as React from "react";
import type { SortingState } from "@tanstack/react-table";
import type { PaginationMeta } from "@/lib/pagination/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/types";
import { buildPaginationParams, type SortOrder } from "@/lib/pagination/params";

export interface ServerDataTablePaginationChange {
  pageIndex: number;
  pageSize: number;
  getAll?: boolean;
}

export interface ServerDataTableSortChange {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface UseServerDataTableOptions {
  initialPageSize?: number;
  initialGetAll?: boolean;
  filterKey?: string;
}

export function useServerDataTable(options: UseServerDataTableOptions = {}) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(
    options.initialPageSize ?? DEFAULT_PAGE_SIZE,
  );
  const [getAll, setGetAll] = React.useState(options.initialGetAll ?? false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [paginationMeta, setPaginationMeta] = React.useState<PaginationMeta | null>(null);

  const sortBy = sorting[0]?.id;
  const sortOrder: SortOrder | undefined = sorting[0]
    ? sorting[0].desc
      ? "desc"
      : "asc"
    : undefined;

  const resetToFirstPage = React.useCallback(() => {
    setPageIndex(0);
  }, []);

  const buildQueryParams = React.useCallback(
    (filters?: Record<string, string | number | boolean | undefined | null>) =>
      buildPaginationParams({
        page: pageIndex + 1,
        pageSize: getAll ? DEFAULT_PAGE_SIZE : pageSize,
        getAll,
        sortBy,
        sortOrder,
        filters,
      }),
    [pageIndex, pageSize, getAll, sortBy, sortOrder],
  );

  const handlePaginationChange = React.useCallback(
    ({ pageIndex: nextIndex, pageSize: nextSize, getAll: nextGetAll }: ServerDataTablePaginationChange) => {
      setPageIndex(nextIndex);
      if (nextGetAll) {
        setGetAll(true);
        setPageSize(DEFAULT_PAGE_SIZE);
        return;
      }
      setGetAll(false);
      setPageSize(nextSize);
    },
    [],
  );

  const onSortParamsChange = React.useCallback((sort: ServerDataTableSortChange) => {
    if (sort.sortBy) {
      setSorting([{ id: sort.sortBy, desc: sort.sortOrder === "desc" }]);
    } else {
      setSorting([]);
    }
    setPageIndex(0);
  }, []);

  const applyPaginationMeta = React.useCallback((meta: PaginationMeta) => {
    setPaginationMeta(meta);
  }, []);

  return {
    pageIndex,
    pageSize: getAll ? DEFAULT_PAGE_SIZE : pageSize,
    getAll,
    sorting,
    sortBy,
    sortOrder,
    paginationMeta,
    pageCount: paginationMeta?.totalPages ?? 1,
    rowCount: paginationMeta?.totalCount ?? 0,
    setPageIndex,
    setPageSize,
    setGetAll,
    setSorting,
    resetToFirstPage,
    buildQueryParams,
    handlePaginationChange,
    onSortParamsChange,
    applyPaginationMeta,
  };
}
