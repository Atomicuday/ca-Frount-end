import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './TablePagination.css';

/**
 * Shared TablePagination component for Documents, Clients and practice vaults.
 *
 * @param {number} currentPage - Current 1-based page index
 * @param {number} pageSize - Number of items per page
 * @param {number} totalItems - Total count of items matching current filters
 * @param {number} [totalPages] - Total number of pages (computed if not provided)
 * @param {string} [itemName='documents'] - Entity label (e.g. 'documents' or 'clients')
 * @param {function} onPageChange - Callback when user navigates to another page
 * @param {boolean} [loading=false] - Whether data is actively loading
 * @param {string} [className=''] - Optional extra class names
 */
export default function TablePagination({
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  totalPages,
  itemName = 'documents',
  onPageChange,
  loading = false,
  className = ''
}) {
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const computedTotalPages = totalPages !== undefined
    ? Math.max(1, Number(totalPages) || 1)
    : Math.max(1, Math.ceil(safeTotalItems / safePageSize));

  // Calculate displayed range: "Showing 1–6 of 6 clients" or "Showing 0 of 0 clients/documents"
  let rangeLabel = '';
  if (safeTotalItems === 0) {
    rangeLabel = `Showing 0 of 0 ${itemName}`;
  } else {
    const start = Math.min((currentPage - 1) * safePageSize + 1, safeTotalItems);
    const end = Math.min(currentPage * safePageSize, safeTotalItems);
    rangeLabel = `Showing ${start}–${end} of ${safeTotalItems} ${itemName}`;
  }

  const isPrevDisabled = currentPage <= 1 || safeTotalItems === 0 || loading;
  const isNextDisabled = currentPage >= computedTotalPages || safeTotalItems === 0 || loading;

  const handlePrev = (e) => {
    e.preventDefault();
    if (!isPrevDisabled && onPageChange) {
      onPageChange(Math.max(1, currentPage - 1));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!isNextDisabled && onPageChange) {
      onPageChange(Math.min(computedTotalPages, currentPage + 1));
    }
  };

  return (
    <div
      className={`zd-table-pagination-footer zd-docs-pagination-footer ca-pagination-bar ${className}`}
      role="navigation"
      aria-label={`${itemName} pagination`}
    >
      <div className="zd-pagination-info ca-pagination-info">
        <span>{rangeLabel}</span>
      </div>

      <div className="zd-pagination-controls ca-pagination-controls">
        <button
          type="button"
          className="zd-pagination-btn ca-pagination-btn"
          disabled={isPrevDisabled}
          onClick={handlePrev}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          className="zd-pagination-btn ca-pagination-btn"
          disabled={isNextDisabled}
          onClick={handleNext}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
