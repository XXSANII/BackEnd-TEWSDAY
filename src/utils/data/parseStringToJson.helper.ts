/**
 * ============================================================================
 * @name    parseStringToJson
 * @desc    Parses a string to JSON if possible, otherwise returns the original value.
 *
 * ============================================================================
 */
export function parseStringToJson<T>(value: string | T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }
  return value;
}
