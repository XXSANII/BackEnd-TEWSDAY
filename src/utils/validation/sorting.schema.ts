import { z } from 'zod';

/**
 * ============================================================================
 * @name    sortingSchema
 * @desc
 * - A reuseable schema for sort query parameters.
 * - This function can config parameters in generic terms.
 * - .coerce.boolean() converts the string from req.query into a boolean.
 * - .default() provides a value if one isn't given.
 *
 * ============================================================================
 */
export const sortingSchema = <T extends readonly [string, ...string[]]>(
  validKeys: T,
  defaultKey: T[number],
  isAsc: boolean = false
) =>
  z.object({
    sortKey: z.enum(validKeys).default(defaultKey),
    sortAsc: z.coerce.boolean().default(isAsc),
  });

/**
 * ============================================================================
 * @name    SortingResponse
 * @desc
 * - A response schema for paginated results.
 * - Fields can be null if pagination is not applied or no data is available.
 *
 * ============================================================================
 */
export interface SortingResponse {
  sortKey: string | null;
  sortAsc: boolean | null;
}
