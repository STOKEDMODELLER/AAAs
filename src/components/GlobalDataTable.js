import React from "react";
import {
  useTable,
  useFilters,
  useSortBy,
  usePagination,
  useGlobalFilter,
} from "react-table";
import Notification from "./Notification";

/**
 * A reusable data table using React Table v7, with:
 * - Sorting
 * - Pagination
 * - Optional global filter
 * - Loading & error states
 *
 * Props:
 * - columns (required): Array describing each column definition { Header, accessor, ... }
 * - data (required): The array of data objects to display
 * - loading (optional): Boolean, if true shows a loading state
 * - error (optional): String or null, if not null shows an error
 * - title (optional): String displayed as table title
 * - onGlobalFilterChange (optional): Callback to enable searching
 * - initialPageSize (optional): number, sets initial page size (default: 5)
 * - pageSizeOptions (optional): Array of numbers for rows per page
 */
function GlobalDataTable({
  columns,
  data,
  loading = false,
  error = null,
  title = "Data Table",
  onGlobalFilterChange,
  initialPageSize = 5,
  pageSizeOptions = [5, 10, 20],
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: initialPageSize },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const handleGlobalFilter = (event) => {
    setGlobalFilter(event.target.value);
    if (onGlobalFilterChange) onGlobalFilterChange(event.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Table Title & Global Filter */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {onGlobalFilterChange && (
          <input
            type="text"
            placeholder={`Search in ${title}...`}
            onChange={handleGlobalFilter}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Loading & Error States */}
      {loading && <Notification type="info" message="Loading data..." />}
      {error && <Notification type="error" message={error} />}

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          {...getTableProps()}
          className="min-w-full bg-white border border-gray-300"
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                className="bg-gray-100"
              >
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps(
                      column.getSortByToggleProps?.()
                    )}
                    className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                  >
                    {column.render("Header")}
                    {column.isSorted
                      ? column.isSortedDesc
                        ? " ↓"
                        : " ↑"
                      : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.length > 0 ? (
              page.map((row) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    className="hover:bg-gray-50 border-b border-gray-200"
                  >
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-sm text-gray-500 text-center"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        {/* Rows per page */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Rows per page:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border rounded focus:outline-none"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            className={`px-2 py-1 border rounded ${
              !canPreviousPage
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-200"
            }`}
          >
            {"<<"}
          </button>
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className={`px-2 py-1 border rounded ${
              !canPreviousPage
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-200"
            }`}
          >
            {"<"}
          </button>
          <span className="text-sm text-gray-600">
            Page <strong>{pageIndex + 1}</strong> of{" "}
            <strong>{pageOptions.length}</strong>
          </span>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className={`px-2 py-1 border rounded ${
              !canNextPage
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-200"
            }`}
          >
            {">"}
          </button>
          <button
            onClick={() => gotoPage(pageOptions.length - 1)}
            disabled={!canNextPage}
            className={`px-2 py-1 border rounded ${
              !canNextPage
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-200"
            }`}
          >
            {">>"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlobalDataTable;
