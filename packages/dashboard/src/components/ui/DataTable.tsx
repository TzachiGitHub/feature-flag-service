import { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Skeleton from './Skeleton';

/* ── Types ────────────────────────────── */

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  sortable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  getRowId?: (row: T) => string;
  pageSize?: number;
  stickyHeader?: boolean;
}

type SortDir = 'asc' | 'desc';

/* ── Component ────────────────────────── */

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  sortable = false,
  selectable = false,
  onSelectionChange,
  getRowId = (row) => String((row as Record<string, unknown>)['id'] ?? JSON.stringify(row)),
  pageSize = 25,
  stickyHeader = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  /* sorting */
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      return 0;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  /* selection */
  const toggleRow = useCallback(
    (row: T) => {
      const id = getRowId(row);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        const selected = data.filter((r) => next.has(getRowId(r)));
        onSelectionChange?.(selected);
        return next;
      });
    },
    [data, getRowId, onSelectionChange]
  );

  const toggleAll = useCallback(() => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const ids = new Set(paged.map(getRowId));
      setSelectedIds(ids);
      onSelectionChange?.(paged);
    }
  }, [paged, selectedIds.size, getRowId, onSelectionChange]);

  /* loading skeleton */
  if (loading) {
    return (
      <div className="overflow-hidden rounded-card border border-slate-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-800 last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton variant="text" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* empty */
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const allSelected = paged.length > 0 && selectedIds.size === paged.length;

  return (
    <div className="space-y-3">
      {/* bulk actions bar */}
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-600/10 border border-indigo-500/30 rounded-button text-sm text-indigo-300 animate-fade-in">
          <span className="font-medium">{selectedIds.size} selected</span>
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={clsx('border-b border-slate-700 bg-slate-800/60', stickyHeader && 'sticky top-0 z-[1]')}>
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 h-4 w-4"
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const isSortable = sortable && col.sortable !== false;
                  return (
                    <th
                      key={col.key}
                      style={col.width ? { width: col.width } : undefined}
                      className={clsx(
                        'px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider',
                        isSortable && 'cursor-pointer select-none hover:text-slate-200 transition-colors'
                      )}
                      onClick={isSortable ? () => handleSort(col.key) : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.header}
                        {isSortable && (
                          <span className="text-slate-600">
                            {sortKey === col.key ? (
                              sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paged.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    className={clsx(
                      'hover:bg-slate-800/50 transition-colors',
                      onRowClick && 'cursor-pointer',
                      selectedIds.has(id) && 'bg-indigo-500/5'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => toggleRow(row)}
                          className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 h-4 w-4"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-slate-300">
                        {col.render ? col.render(row) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ── Pagination ────────────────────────── */

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between text-sm text-slate-400">
      <span>
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <PaginationBtn onClick={() => onPageChange(0)} disabled={page === 0}>
          <ChevronsLeft className="h-4 w-4" />
        </PaginationBtn>
        <PaginationBtn onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          <ChevronLeft className="h-4 w-4" />
        </PaginationBtn>
        <span className="px-3 text-slate-300">
          {page + 1} / {totalPages}
        </span>
        <PaginationBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>
          <ChevronRight className="h-4 w-4" />
        </PaginationBtn>
        <PaginationBtn onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1}>
          <ChevronsRight className="h-4 w-4" />
        </PaginationBtn>
      </div>
    </div>
  );
}

function PaginationBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
