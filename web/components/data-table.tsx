"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconSearch,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination/types"

// --- Context ---
const DataTableContext = React.createContext<{
  onEditClick?: (row: unknown) => void;
  onDelete?: (row: unknown) => void;
}>({})

// --- Components ---

export function DragHandle({ id }: { id: string | number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

export const DraggableRow = React.memo(function DraggableRow({ row, onRowClick }: { row: Row<any>, onRowClick?: (row: any) => void }) {
  const rowId = row.original.id || row.id;
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: rowId as UniqueIdentifier,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className={cn(
        "relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80",
        onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors"
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('[data-no-row-click="true"]')
        ) return;
        onRowClick?.(row.original)
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell 
          key={cell.id} 
          className={cn(
            "align-middle text-left text-foreground",
            ["drag", "select", "sl", "id"].includes(cell.column.id.toLowerCase()) ? "w-16! shrink-0" : "whitespace-normal",
            ["name", "employeename", "fullname", "fullnameen"].includes(cell.column.id.toLowerCase()) && "whitespace-nowrap",
            (cell.column.columnDef.meta as any)?.className
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
})

export function DataTable<TData extends { id?: string | number }>({
  data: initialData,
  columns,
  showTabs = true,
  showActions = true,
  showColumnCustomizer = true,
  enableSelection = false,
  enableDrag = false,
  onAddClick,
  onEditClick,
  onDelete,
  onDeleteSelected,
  addLabel = "Add New",
  searchKey,
  filterKey,
  tabs,
  filters,
  isLoading = false,
  getRowId,
  onSelectionChange,
  footer,
  onRowClick,
  className,
  paginationMode = "client",
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  pageCount,
  rowCount,
  getAll = false,
  onPaginationChange,
  onSortingChange,
}: {
  data: TData[]
  columns: ColumnDef<TData>[]
  showTabs?: boolean
  showActions?: boolean
  showColumnCustomizer?: boolean
  enableSelection?: boolean
  enableDrag?: boolean
  onAddClick?: () => void
  onEditClick?: (row: TData) => void
  onDelete?: (row: TData) => void
  onDeleteSelected?: (selectedRows: TData[]) => void
  addLabel?: string
  searchKey?: string
  filterKey?: string
  tabs?: { value: string; label: string; count?: number }[]
  filters?: {
    columnId: string
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[]
  isLoading?: boolean
  getRowId?: (row: TData) => string
  onSelectionChange?: (selectedRows: TData[]) => void
  footer?: React.ReactNode
  onRowClick?: (row: TData) => void
  className?: string
  paginationMode?: "client" | "server"
  /** 0-based page index for server pagination */
  pageIndex?: number
  /** page size (50 when getAll is true) */
  pageSize?: number
  /** total pages from server */
  pageCount?: number
  /** total rows from server */
  rowCount?: number
  /** server mode: all rows loaded; metadata still uses pageSize 50 */
  getAll?: boolean
  onPaginationChange?: (next: { pageIndex: number; pageSize: number; getAll?: boolean }) => void
  onSortingChange?: (sort: { sortBy?: string; sortOrder?: "asc" | "desc" }) => void
}) {
  const [data, setData] = React.useState(() => initialData)
  const [activeTab, setActiveTab] = React.useState("all")
  const isMobile = useIsMobile()

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const tableColumns = React.useMemo(() => {
    const hasSelection = columns.some(c => c.id === 'select');
    const hasActions = columns.some(c => c.id === 'actions');
    const hasDrag = columns.some(c => c.id === 'drag');

    const result = [...columns];

    if (!hasActions && showActions) {
      result.push(getActionsColumn<TData>());
    }

    const base = getBaseColumns<TData>();
    if (!hasSelection && enableSelection) {
      result.unshift(base[1]);
    }
    if (!hasDrag && enableDrag) {
      result.unshift(base[0]);
    }

    return result;
  }, [columns, showActions, enableSelection, enableDrag]);

  const [rowSelection, setRowSelection] = React.useState({})
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: paginationMode === "server" ? DEFAULT_PAGE_SIZE : 10,
  })

  const isServerPagination = paginationMode === "server"
  /** Server fetched full dataset (getAll); paginate 50 rows per page in the browser. */
  const serverGetAllClientPages = isServerPagination && getAll

  React.useEffect(() => {
    if (!isServerPagination || serverGetAllClientPages) return
    if (typeof controlledPageIndex !== "number" || typeof controlledPageSize !== "number") return
    setPagination((prev) => {
      if (prev.pageIndex === controlledPageIndex && prev.pageSize === controlledPageSize) return prev
      return { pageIndex: controlledPageIndex, pageSize: controlledPageSize }
    })
  }, [controlledPageIndex, controlledPageSize, isServerPagination, serverGetAllClientPages])

  React.useEffect(() => {
    if (!serverGetAllClientPages) return
    setPagination({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE })
  }, [serverGetAllClientPages])

  const handlePaginationChange = React.useCallback(
    (next: { pageIndex: number; pageSize: number; getAll?: boolean }) => {
      if (isServerPagination) {
        onPaginationChange?.(next)
        return
      }
      setPagination({ pageIndex: next.pageIndex, pageSize: next.pageSize })
    },
    [isServerPagination, onPaginationChange],
  )

  // Fix for infinite loop: Use ref for onSelectionChange to avoid dependency cycle
  const onSelectionChangeRef = React.useRef(onSelectionChange)
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  React.useEffect(() => {
    if (onSelectionChangeRef.current) {
      // Buffer/Lookup Map for O(1) row retrieval - improves time complexity from O(N*M) to O(M)
      const dataMap = new Map(data.map(item => {
        const itemId = (item.id || (item as any).leaveTypeId || "").toString();
        return [itemId, item];
      }));

      const selectedRows = Object.keys(rowSelection)
        .map((id) => dataMap.get(id))
        .filter(Boolean) as TData[];

      onSelectionChangeRef.current(selectedRows);
    }
  }, [rowSelection, data])

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map((row, index) => ((row.id || (row as any).leaveTypeId || index).toString()) as UniqueIdentifier) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row, index) => {
      if (getRowId) return getRowId(row)
      return (row as any).id?.toString() || (row as any).leaveTypeId?.toString() || index.toString()
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      setSorting(next)
      if (isServerPagination && onSortingChange) {
        const first = next[0]
        onSortingChange(
          first
            ? { sortBy: first.id, sortOrder: first.desc ? "desc" : "asc" }
            : {},
        )
      }
    },
    manualSorting: isServerPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater
      if (serverGetAllClientPages) {
        setPagination(next)
        return
      }
      handlePaginationChange(next)
    },
    manualPagination: isServerPagination && !serverGetAllClientPages,
    pageCount: isServerPagination && !serverGetAllClientPages ? pageCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel:
      serverGetAllClientPages || !isServerPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const isFiltered = table.getState().columnFilters.length > 0

  const clientAllModePageCount = React.useMemo(() => {
    if (!serverGetAllClientPages) return 1
    const size = pagination.pageSize || DEFAULT_PAGE_SIZE
    const fromRows = table.getPageCount()
    const total =
      typeof rowCount === "number" && rowCount > 0
        ? rowCount
        : data.length
    const fromMeta = total > 0 ? Math.ceil(total / size) : 1
    return Math.max(fromRows, fromMeta, 1)
  }, [
    serverGetAllClientPages,
    table,
    pagination.pageSize,
    rowCount,
    data.length,
  ])

  const rowsSelectValue = isServerPagination
    ? serverGetAllClientPages
      ? "all"
      : `${typeof controlledPageSize === "number" ? controlledPageSize : pagination.pageSize}`
    : `${table.getState().pagination.pageSize}`

  const activePageSize =
    isServerPagination && typeof controlledPageSize === "number"
      ? controlledPageSize
      : pagination.pageSize

  const skeletonRowCount = React.useMemo(() => {
    if (activePageSize > 0 && activePageSize < 10_000) return activePageSize
    if (typeof rowCount === "number" && rowCount > 0) return Math.min(rowCount, 100)
    if (data.length > 0) return Math.min(data.length, 100)
    return 10
  }, [activePageSize, rowCount, data.length])

  // Handle Tab Filtering
  React.useEffect(() => {
    if (!filterKey) return
    const column = table.getColumn(filterKey)
    if (!column) return
    if (activeTab === "all") {
      column.setFilterValue(undefined)
    } else {
      const filterValue = activeTab === "true" ? true : activeTab === "false" ? false : activeTab
      column.setFilterValue(filterValue)
    }
  }, [activeTab, filterKey, table])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const tableContent = (
    <div className="flex flex-col gap-4 overflow-auto px-4">
      <div className="overflow-hidden rounded-md border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        colSpan={header.colSpan} 
                        className={cn(
                          "wrap-break-word py-3 h-auto align-top text-left",
                          ["drag", "select", "sl"].includes(header.id.toLowerCase()) ? "w-12 shrink-0" : "min-w-[100px] whitespace-normal",
                          ["name", "employeename", "fullname", "fullnameen"].includes(header.id.toLowerCase()) && "whitespace-nowrap",
                          (header.column.columnDef.meta as any)?.headerClassName
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: skeletonRowCount }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {tableColumns.map((col, j) => {
                      const colId = (col.id ?? "").toLowerCase()
                      const isCompact =
                        colId === "select" ||
                        colId === "drag" ||
                        colId === "sl" ||
                        colId === "actions"
                      return (
                        <TableCell
                          key={j}
                          className={cn(
                            "py-3",
                            (col.meta as { className?: string } | undefined)?.className,
                          )}
                        >
                          {isCompact ? (
                            <Skeleton className="h-4 w-4 rounded-sm" />
                          ) : (
                            <Skeleton
                              className={cn(
                                "h-4",
                                j % 3 === 0 ? "w-[85%]" : j % 3 === 1 ? "w-[70%]" : "w-[90%]",
                              )}
                            />
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} onRowClick={onRowClick} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {footer && <TableFooter>{footer}</TableFooter>}
          </Table>
        </DndContext>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
          {table.getSelectedRowModel().rows.length} of{" "}
          {isServerPagination
            ? (rowCount ?? data.length)
            : table.getFilteredRowModel().rows.length}{" "}
          row(s) selected.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Rows:</span>
            <NativeSelect
              value={rowsSelectValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") {
                  if (isServerPagination) {
                    handlePaginationChange({
                      pageIndex: 0,
                      pageSize: DEFAULT_PAGE_SIZE,
                      getAll: true,
                    });
                  } else {
                    table.setPageSize(data.length || 1000000);
                  }
                } else {
                  const nextSize = Number(val);
                  if (isServerPagination) {
                    handlePaginationChange({
                      pageIndex: 0,
                      pageSize: nextSize,
                      getAll: false,
                    });
                  } else {
                    table.setPageSize(nextSize);
                  }
                }
              }}
              className="h-8 py-0 min-w-[60px] sm:min-w-[70px] text-xs sm:text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((pageSize) => (
                <option key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </option>
              ))}
              <option value="all">All</option>
            </NativeSelect>
          </div>
          <div className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {serverGetAllClientPages
              ? clientAllModePageCount
              : isServerPagination
                ? (pageCount ?? 1)
                : table.getPageCount()}
          </div>
          <div className="flex items-center gap-1">
            {!isMobile && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (serverGetAllClientPages) {
                    table.setPageIndex(0);
                  } else if (isServerPagination) {
                    handlePaginationChange({
                      pageIndex: 0,
                      pageSize: pagination.pageSize,
                    });
                  } else {
                    table.setPageIndex(0);
                  }
                }}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="size-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (serverGetAllClientPages || !isServerPagination) {
                  table.previousPage();
                } else {
                  handlePaginationChange({
                    pageIndex: Math.max(0, pagination.pageIndex - 1),
                    pageSize: pagination.pageSize,
                  });
                }
              }}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (serverGetAllClientPages || !isServerPagination) {
                  table.nextPage();
                } else {
                  const maxIndex = Math.max(0, (pageCount ?? 1) - 1);
                  handlePaginationChange({
                    pageIndex: Math.min(maxIndex, pagination.pageIndex + 1),
                    pageSize: pagination.pageSize,
                  });
                }
              }}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="size-4" />
            </Button>
            {!isMobile && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (serverGetAllClientPages || !isServerPagination) {
                    table.setPageIndex(table.getPageCount() - 1);
                  } else {
                    const last = Math.max(0, (pageCount ?? 1) - 1);
                    handlePaginationChange({
                      pageIndex: last,
                      pageSize: pagination.pageSize,
                    });
                  }
                }}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DataTableContext.Provider value={{
      onEditClick: onEditClick as (row: unknown) => void,
      onDelete: onDelete as (row: unknown) => void
    }}>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className={cn("w-full flex flex-col gap-4", className)}>
        {searchKey && (
          <div className="flex items-center px-4 pt-2 w-full">
            <div className="relative w-full sm:max-w-sm">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="pl-9 h-10 w-full bg-muted/40 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 gap-4 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {filters?.map((filter) => (
              table.getColumn(filter.columnId) && (
                <DataTableFacetedFilter
                  key={filter.columnId}
                  column={table.getColumn(filter.columnId)}
                  title={filter.title}
                  options={filter.options}
                />
              )
            ))}
            {showTabs && tabs && tabs.length > 0 && (
              <TabsList className="h-9 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <TabsTrigger value="all" className="px-3 text-[10px] sm:text-xs">All</TabsTrigger>
                {tabs?.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="px-3 text-[10px] sm:text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.resetColumnFilters()}
                className="h-8 text-destructive px-2 text-xs"
              >
                Reset
                <IconTrash className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
          {showActions && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2 h-8 sm:h-9">
                      <IconTrash className="size-4" />
                      <span className="hidden sm:inline">Delete ({table.getFilteredSelectedRowModel().rows.length})</span>
                      <span className="sm:hidden">({table.getFilteredSelectedRowModel().rows.length})</span>
                    </Button>
                  </AlertDialogTrigger>
                  {/* ... AlertDialogContent ... */}
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Delete {table.getFilteredSelectedRowModel().rows.length} selected records?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={async () => {
                          const rows = table.getFilteredSelectedRowModel().rows.map(r => r.original);
                          await onDeleteSelected?.(rows);
                          setRowSelection({});
                          setShowBulkDeleteDialog(false);
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {onAddClick && (
                <Button size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9" onClick={onAddClick}>
                  <IconPlus className="size-4" />
                  <span>{addLabel}</span>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="m-0 border-0 p-0 shadow-none">
          {tableContent}
        </div>
      </Tabs>
    </DataTableContext.Provider>
  )
}

// --- Column Helpers ---
export function getBaseColumns<TData extends { id?: string | number }>(): ColumnDef<TData>[] {
  return [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={(row.original.id || (row.original as any).leaveTypeId || row.id) as UniqueIdentifier} />,
      size: 40,
      enableSorting: false,
    },
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
          aria-label="Select all rows"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          className="translate-y-[2px]"
        />
      ),
      size: 40,
      enableSorting: false,
    },
  ]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RowActions({ row }: { row: Row<any> }) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [showViewSheet, setShowViewSheet] = React.useState(false)
  const isMobile = useIsMobile()
  const { onEditClick, onDelete } = React.useContext(DataTableContext)

  const details = Object.entries(row.original as Record<string, unknown>).filter(([k]) => k !== 'id')

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 ml-auto">
            <IconDotsVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowViewSheet(true)}>View details</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditClick?.(row.original)}>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={showViewSheet} onOpenChange={setShowViewSheet}>
        <SheetContent className={cn("flex flex-col h-full", isMobile ? "w-full" : "sm:max-w-xl")}>
          <SheetHeader className="border-b pb-4 shrink-0">
            <SheetTitle>Details</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {details.map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <div className="text-sm border p-2 rounded-md bg-muted/50">
                    {value === null || value === undefined || String(value).trim() === ""
                      ? "-"
                      : (typeof value === 'object' ? JSON.stringify(value) : String(value))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowViewSheet(false);
                onEditClick?.(row.original);
              }}
            >
              Edit
            </Button>
            <SheetClose asChild>
              <Button variant="secondary" size="sm">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this record?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                await onDelete?.(row.original)
                setShowDeleteDialog(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function getActionsColumn<TData extends { id?: string | number }>(): ColumnDef<TData> {
  return {
    id: "actions",
    header: () => <div className="text-right text-xs font-medium uppercase text-muted-foreground">Actions</div>,
    cell: ({ row }) => <RowActions row={row} />,
    size: 50,
  }
}
