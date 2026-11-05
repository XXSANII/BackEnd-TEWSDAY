interface ApplyPaginationParams {
  query: any; // The query object to apply pagination to
  pageNumber?: number | null; // The page number (1-based)
  pageSize?: number | null; // The number of items per page
}

/**
 * ============================================================================
 * @name    applyPagination
 * @desc    Applies pagination to a database query - The query object to apply pagination to.
 *
 * ============================================================================
 */
export function applyPagination({ query, pageNumber = 1, pageSize = 10 }: ApplyPaginationParams) {
  if (pageNumber === null) {
    pageNumber = 1;
  }
  if (pageSize === null) {
    pageSize = 10;
  }

  if (pageNumber < 1 || pageSize < 1) {
    pageNumber = 1;
    pageSize = 10;
  }

  query = query.offset((pageNumber - 1) * pageSize).limit(pageSize);

  return query;
}
