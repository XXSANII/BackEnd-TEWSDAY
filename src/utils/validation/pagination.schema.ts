import { z } from 'zod';

/**
 * ============================================================================
 * @name    paginationSchema
 * @desc
 * - A reusable schema for pagination query parameters.
 * - coerce.number() converts the string from req.query into a number.
 * - .default() provides a value if one isn't given.
 *
 * ============================================================================
 */
export const paginationSchema = z.object({
  pageNumber: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
  pageAll: z.coerce.boolean().default(false).optional(),
});

/**
 * ============================================================================
 * @name    PaginatedResponse
 * @desc
 * - A response schema for paginated results.
 * - Fields can be null if pagination is not applied or no data is available.
 *
 * ============================================================================
 */
export const PaginatedResponse = z.object({
  currentPage: z.number().nullable(),
  lastPage: z.number().nullable(),
  nextPage: z.number().nullable(),
  prevPage: z.number().nullable(),
  pageSize: z.number().nullable(),
});

export type PaginatedResponse = z.infer<typeof PaginatedResponse>;
