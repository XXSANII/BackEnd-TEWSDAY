/**
 * ============================================================================
 * @name    sanitizeString
 * @desc    Sanitizes a string by removing spaces and dashes from the input string.
 *
 * ============================================================================
 */
export function sanitizeString(value: string, isRemoveDashes: boolean = false): string {
  return value.replace(/[\s-]/g, '');
}
