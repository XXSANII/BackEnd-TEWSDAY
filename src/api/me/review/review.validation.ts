import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { reviewTypeList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    createReviewSchema
 * @code    me_011_c
 * @desc    Create session review schema
 *
 * ============================================================================
 */
export const createReviewSchema = z.object({
  params: z.object({
    sessionId: z.uuidv4('me_011_c_v_01'),
  }),
  body: z.object({
    ratingScore: z.number('me_011_c_v_02').int('me_011_c_v_03').min(1, 'me_011_c_v_03').max(5, 'me_011_c_v_03'),
    comment: z.string('me_011_c_v_04').max(2000, 'me_011_c_v_04').optional().nullable(),
  }),
});

export const createReviewResponseSchema = z.object({
  reviewId: z.string(),
  classSessionId: z.string(),
  ratingScore: z.number(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

export type CreateReviewParams = z.infer<typeof createReviewSchema>['params'];
export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type CreateReviewResponse = z.infer<typeof createReviewResponseSchema>;

/**
 * ============================================================================
 * @name    searchMyReviewSchema
 * @code    me_011_s
 * @desc    Search reviews written by the authenticated user schema
 *
 * ============================================================================
 */
export const searchMyReviewSortMap = {
  createdAt: 'createdAt',
  ratingScore: 'ratingScore',
} as const;
export const searchMyReviewValidSortKeys = Object.keys(searchMyReviewSortMap) as [string, ...string[]];

export const searchMyReviewSchema = z.object({
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchMyReviewValidSortKeys, 'createdAt').shape,
  }),
});

export const searchMyReviewResponseSchemaBody = z.object({
  reviewId: z.string(),
  classSessionId: z.string(),
  tutorProfileId: z.string().nullable(),
  reviewType: z.enum(reviewTypeList),
  ratingScore: z.number(),
  comment: z.string().nullable(),
  isPublishedFlag: z.boolean(),
  createdAt: z.string(),
});

export const searchMyReviewResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchMyReviewResponseSchemaBody),
});

export type SearchMyReviewInput = z.infer<typeof searchMyReviewSchema>['body'];
export type SearchMyReviewResponseBody = z.infer<typeof searchMyReviewResponseSchemaBody>;
export type SearchMyReviewResponse = z.infer<typeof searchMyReviewResponseSchema>;
