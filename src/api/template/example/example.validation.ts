import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import z from 'zod';
import { sortingSchema } from '@/utils/validation/sorting.schema';

/**
 * ============================================================================
 * @name  createExampleSchema
 * @code  tmp_001_c
 * @desc  Creating example schema
 *
 * ============================================================================
 */
export const createExampleSchema = z.object({
  body: z.object({
    name: z.string('tmp_001_c_v_01'),
  }),
});

export const createExampleResponseSchema = z.object({
  exampleId: z.string(),
});

export type CreateExampleInput = z.infer<typeof createExampleSchema>['body'];
export type CreateExampleResponse = z.infer<typeof createExampleResponseSchema>;

/**
 * ============================================================================
 * @name  deleteExampleSchema
 * @code  tmp_001_d
 * @desc  Delete example schema
 *
 * ============================================================================
 */
export const deleteExampleSchema = z.object({
  params: z.object({
    exampleId: z.string('tmp_001_d_v_01'),
  }),
});

export const deleteExampleResponseSchema = z.object({
  exampleId: z.string(),
});

export type DeleteExampleParams = z.infer<typeof deleteExampleSchema>['params'];
export type DeleteExampleResponse = z.infer<typeof deleteExampleResponseSchema>;

/**
 * ============================================================================
 * @name    editExampleSchema
 * @code    tmp_001_e
 * @desc    Edit example schema
 *
 * ============================================================================
 */
export const editExampleSchema = z.object({
  params: z.object({
    exampleId: z.uuidv4('tmp_001_e_v_01'),
  }),
  body: z.object({
    name: z.string('tmp_001_e_v_02').optional(),
  }),
});

export const editExampleResponseSchema = z.object({
  exampleId: z.string(),
});

export type EditExampleInput = z.infer<typeof editExampleSchema>['body'];
export type EditExampleParams = z.infer<typeof editExampleSchema>['params'];
export type EditExampleResponse = z.infer<typeof editExampleResponseSchema>;

/**
 * ============================================================================
 * @name    getExampleSchema
 * @code    tmp_001_g
 * @desc    Get example schema
 *
 * ============================================================================
 */
export const getExampleSchema = z.object({
  params: z.object({
    exampleId: z.string('tmp_001_g_v_01'),
  }),
});

export const getExampleResponseSchema = z.object({
  exampleId: z.string(),
  name: z.string(),
});

export type GetExampleParams = z.infer<typeof getExampleSchema>['params'];
export type GetExampleResponse = z.infer<typeof getExampleResponseSchema>;

/**
 * ============================================================================
 * @name    searchExampleSchema
 * @code    tmp_001_s
 * @desc    Search examples schema
 *
 * ============================================================================
 */
export const searchExampleSortMap = {
  name: 'name',
  createdAt: 'createdAt',
} as const;
export const searchExampleValidSortKeys = Object.keys(searchExampleSortMap) as [string, ...string[]];
export const searchExampleSchema = z.object({
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchExampleValidSortKeys, 'name').shape,
    name: z.string('tmp_001_s_v_01').optional(),
  }),
});

export const searchExampleResponseSchemaBody = z.object({
  exampleId: z.string(),
  name: z.string(),
});
export const searchExampleResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchExampleResponseSchemaBody),
});

export type SearchExampleInput = z.infer<typeof searchExampleSchema>['body'];
export type SearchExampleResponseBody = z.infer<typeof searchExampleResponseSchemaBody>;
export type SearchExampleResponse = z.infer<typeof searchExampleResponseSchema>;
