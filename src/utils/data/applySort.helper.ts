interface ApplySortParams {
  query: any; // The query object to apply sorting to
  sortKey?: string; // The column to sort by
  sortAsc?: boolean; // Whether to sort in ascending order
  validColumns?: string[]; // List of valid columns for sorting
}

/**
 * ============================================================================
 * @name    applySort
 * @desc    Applies sorting to a database query - The query object to apply sorting to.
 *
 * ============================================================================
 */
export function applySort({
  query,
  sortKey = 'createdAt',
  sortAsc = false,
  validColumns = ['createdAt'],
}: ApplySortParams) {
  // Validate the column name
  const isValidColumn = validColumns.includes(sortKey) && sortKey !== 'similarity';
  if (!isValidColumn) {
    return query; // If the column is not valid, return the query unmodified
  }

  const sortColumn = isValidColumn ? sortKey : validColumns[validColumns.length - 1];
  const order = sortAsc ? 'asc' : 'desc';

  // Apply sorting
  query = query.orderBy(sortColumn, order);

  return query;
}
