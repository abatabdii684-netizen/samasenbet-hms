import React from 'react';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';

function DataTable({
  columns,
  data = [],
  loading = false,
  pagination,
  onPageChange,
  onSort,
  sortBy,
  sortOrder,
  emptyText = 'No records found',
  className = '',
}) {
  if (loading) return <LoadingSpinner text="Loading data..." />;

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600' : ''}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={col.width ? { width: col.width } : {}}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="ml-1">
                        {sortBy === col.key
                          ? sortOrder === 'asc'
                            ? <ChevronUpIcon   className="w-3.5 h-3.5 text-primary-500" />
                            : <ChevronDownIcon className="w-3.5 h-3.5 text-primary-500" />
                          : <ChevronUpDownIcon className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-400 text-sm">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row.id ?? rowIdx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;
