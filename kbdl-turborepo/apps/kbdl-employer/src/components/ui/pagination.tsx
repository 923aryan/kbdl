'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

interface DataPaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  showSummary?: boolean;
}

const range = (start: number, end: number) =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index);

const getPaginationItems = (
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): PaginationItem[] => {
  const totalVisiblePages = siblingCount * 2 + 5;

  if (totalPages <= totalVisiblePages) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 3;
  const showRightEllipsis = rightSibling < totalPages - 2;

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, 3 + siblingCount * 2), 'ellipsis-end', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, 'ellipsis-start', ...range(totalPages - (2 + siblingCount * 2), totalPages)];
  }

  return [1, 'ellipsis-start', ...range(leftSibling, rightSibling), 'ellipsis-end', totalPages];
};

export const DataPagination = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  siblingCount = 1,
  className = '',
  showSummary = true,
}: DataPaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const firstItem = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(safePage * pageSize, totalItems);
  const items = getPaginationItems(safePage, totalPages, siblingCount);

  const goToPage = (page: number) => {
    onPageChange(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <div
      className={`flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      {showSummary && (
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{firstItem}</span>-
            <span className="font-semibold text-gray-900">{lastItem}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalItems}</span>
          </p>
          <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
            Page {safePage} of {totalPages}
          </span>
        </div>
      )}

      <nav
        className="flex max-w-full items-center justify-end gap-1 overflow-x-auto"
        aria-label="Pagination"
      >
        <button
          type="button"
          disabled={safePage === 1}
          onClick={() => goToPage(safePage - 1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {items.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              aria-current={safePage === item ? 'page' : undefined}
              className={`h-9 min-w-9 shrink-0 rounded-md border px-3 text-sm font-medium transition ${
                safePage === item
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              {item}
            </button>
          ) : (
            <span
              key={item}
              className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-gray-400"
              aria-hidden="true"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ),
        )}

        <button
          type="button"
          disabled={safePage === totalPages}
          onClick={() => goToPage(safePage + 1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};
