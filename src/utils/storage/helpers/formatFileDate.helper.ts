/**
 * ============================================================================
 * @name    formatFileDate
 * @desc    Format a Date object into a string suitable for file naming.
 *
 * ============================================================================
 */
export function formatFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const microseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}_${microseconds}`;
}
