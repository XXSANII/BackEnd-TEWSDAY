import { PaginatedResponse } from '../validation/pagination.schema';

interface CalculatePaginationParams {
  pageNumber?: number;
  pageSize?: number;
  total?: string | number;
  pageAll?: boolean;
}

/**
 * ============================================================================
 * @name    calculatePagination
 * @desc    Calculates pagination details based on input parameters.
 *
 * ============================================================================
 */
export function calculatePagination({
  pageNumber,
  pageSize,
  total,
  pageAll,
}: CalculatePaginationParams): PaginatedResponse {
  const safeTotal = Math.max(0, parseInt(total?.toString() || '0', 10));
  let size = parseInt(pageSize?.toString() || '10', 10);
  let page = parseInt(pageNumber?.toString() || '1', 10);

  // Validate pageSize
  if (size < 1) {
    size = 10;
  } else if (size > 100) {
    size = 100;
  }

  // Calculate last page (minimum 1 page even when empty)
  const lastPage = Math.max(1, Math.ceil(safeTotal / size));

  // Validate pageNumber
  if (page < 1) {
    page = 1;
  } else if (page > lastPage) {
    page = lastPage;
  }

  let pagination = {
    currentPage: page,
    lastPage: lastPage,
    nextPage: page < lastPage ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
    pageSize: size,
  };

  if (pageAll) {
    pagination = {
      currentPage: 1,
      lastPage: 1,
      nextPage: null,
      prevPage: null,
      pageSize: safeTotal,
    };
  }

  return pagination;
}
