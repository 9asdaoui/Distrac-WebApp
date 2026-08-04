import React, { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowDownAZ,
  ArrowUpZA,
  ArrowUpDown,
  SearchX,
} from 'lucide-react'

/**
 * A generic, premium, reusable DataTable component with search, sort, and pagination.
 *
 * @param {Array} data - The array of data objects.
 * @param {Array} columns - Column definition [{ header, accessor, render, sortable }]
 * @param {string} searchPlaceholder - Placeholder for the search input
 * @param {number} itemsPerPage - Number of items to display per page
 * @param {Function} onRowClick - Optional click handler for rows
 * @param {string} emptyStateMessage - Message to show when data or search is empty
 */
export function DataTable({
  data = [],
  columns = [],
  searchPlaceholder = 'Search...',
  itemsPerPage = 10,
  onRowClick = null,
  emptyStateMessage = 'No results found',
}) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

  // 1. Filter
  const filteredData = useMemo(() => {
    if (!globalFilter) return data
    const lowerFilter = globalFilter.toLowerCase()
    return data.filter((row) => {
      // Check every column for a match
      return columns.some((col) => {
        if (!col.accessor) return false
        const val = row[col.accessor]
        if (val == null) return false
        return String(val).toLowerCase().includes(lowerFilter)
      })
    })
  }, [data, columns, globalFilter])

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData
    const sorted = [...filteredData]
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredData, sortConfig])

  // 3. Paginate
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedData.slice(start, start + itemsPerPage)
  }, [sortedData, currentPage, itemsPerPage])

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [globalFilter])

  const handleSort = (accessor, isSortable) => {
    if (!isSortable || !accessor) return
    setSortConfig((prev) => {
      if (prev.key === accessor) {
        if (prev.direction === 'asc') return { key: accessor, direction: 'desc' }
        return { key: null, direction: 'asc' } // toggle off
      }
      return { key: accessor, direction: 'asc' }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {sortedData.length} {sortedData.length === 1 ? 'result' : 'results'}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                {columns.map((col, i) => {
                  const isSorted = sortConfig.key === col.accessor
                  return (
                    <th
                      key={i}
                      className={`table-th ${col.sortable ? 'cursor-pointer select-none transition-colors hover:text-zinc-800 dark:hover:text-zinc-200' : ''}`}
                      onClick={() => handleSort(col.accessor, col.sortable)}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.header}
                        {col.sortable && (
                          <span className="text-zinc-400 dark:text-zinc-500">
                            {isSorted ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowDownAZ className="h-3.5 w-3.5 text-cc-accent" />
                              ) : (
                                <ArrowUpZA className="h-3.5 w-3.5 text-cc-accent" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="table-td">
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                      <SearchX className="mb-2 h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">{emptyStateMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-cc-surface">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
