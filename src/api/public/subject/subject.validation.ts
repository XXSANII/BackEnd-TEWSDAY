import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';

/**
 * ============================================================================
 * @name    getSubjectSchema
 * @code    pub_001_g
 * @desc    Get subject details schema
 *
 * ============================================================================
 */
export const getSubjectSchema = z.object({
  params: z.object({
    subjectId: z.uuidv4('pub_001_g_v_01'),
  }),
});

export const getSubjectResponseSchema = z.object({
  subjectId: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
});

export type GetSubjectParams = z.infer<typeof getSubjectSchema>['params'];
export type GetSubjectResponse = z.infer<typeof getSubjectResponseSchema>;

/**
 * ============================================================================
 * @name    searchSubjectSchema
 * @code    pub_001_s
 * @desc    Search subjects schema
 *
 * ============================================================================
 */
export const searchSubjectSortMap = {
  name: 'name',
  category: 'category',
  createdAt: 'createdAt',
} as const;
export const searchSubjectValidSortKeys = Object.keys(searchSubjectSortMap) as [string, ...string[]];

export const searchSubjectSchema = z.object({
  body: z.object({
    name: z.string('pub_001_s_v_01').optional(),
    category: z.string('pub_001_s_v_02').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchSubjectValidSortKeys, 'name').shape,
  }),
});

export const searchSubjectResponseSchemaBody = z.object({
  subjectId: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
});

export const searchSubjectResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchSubjectResponseSchemaBody),
});

export type SearchSubjectInput = z.infer<typeof searchSubjectSchema>['body'];
export type SearchSubjectResponseBody = z.infer<typeof searchSubjectResponseSchemaBody>;
export type SearchSubjectResponse = z.infer<typeof searchSubjectResponseSchema>;
