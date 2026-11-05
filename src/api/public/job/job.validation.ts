import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { jobStatusList, teachingLocationList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    searchPublicJobSchema
 * @code    pub_003_s
 * @desc    Search public student jobs schema
 *
 * ============================================================================
 */
export const searchPublicJobSortMap = {
  createdAt: 'createdAt',
  budgetMax: 'budgetMax',
} as const;
export const searchPublicJobValidSortKeys = Object.keys(searchPublicJobSortMap) as [string, ...string[]];

export const searchPublicJobSchema = z.object({
  body: z.object({
    subjectId: z.uuidv4('pub_003_s_v_01').optional(),
    locationType: z.enum(teachingLocationList, 'pub_003_s_v_02').optional(),
    budgetMin: z.number('pub_003_s_v_03').min(0, 'pub_003_s_v_03').optional(),
    budgetMax: z.number('pub_003_s_v_04').min(0, 'pub_003_s_v_04').optional(),
    targetGradeLevel: z.string('pub_003_s_v_05').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchPublicJobValidSortKeys, 'createdAt').shape,
  }),
});

export const searchPublicJobResponseSchemaBody = z.object({
  studentJobId: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  targetGradeLevel: z.string().nullable(),
  topics: z.array(z.string()),
  learningGoal: z.string().nullable(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  locationType: z.enum(teachingLocationList),
  frequencyPerWeek: z.number().nullable(),
  status: z.enum(jobStatusList),
  createdAt: z.string(),
});

export const searchPublicJobResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchPublicJobResponseSchemaBody),
});

export type SearchPublicJobInput = z.infer<typeof searchPublicJobSchema>['body'];
export type SearchPublicJobResponseBody = z.infer<typeof searchPublicJobResponseSchemaBody>;
export type SearchPublicJobResponse = z.infer<typeof searchPublicJobResponseSchema>;

/**
 * ============================================================================
 * @name    getPublicJobSchema
 * @code    pub_003_g
 * @desc    Get public student job details schema
 *
 * ============================================================================
 */
export const getPublicJobSchema = z.object({
  params: z.object({
    jobId: z.uuidv4('pub_003_g_v_01'),
  }),
});

export const getPublicJobResponseSchema = z.object({
  studentJobId: z.string(),
  studentProfileId: z.string(),
  studentDisplayName: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  targetGradeLevel: z.string().nullable(),
  topics: z.array(z.string()),
  learningGoal: z.string().nullable(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  locationType: z.enum(teachingLocationList),
  frequencyPerWeek: z.number().nullable(),
  preferredDays: z.unknown().nullable(),
  status: z.enum(jobStatusList),
  expiredAt: z.string().nullable(),
  shareCount: z.number(),
  createdAt: z.string(),
});

export type GetPublicJobParams = z.infer<typeof getPublicJobSchema>['params'];
export type GetPublicJobResponse = z.infer<typeof getPublicJobResponseSchema>;

/**
 * ============================================================================
 * @name    sharePublicJobSchema
 * @code    pub_003_share
 * @desc    Share public student job schema
 *
 * ============================================================================
 */
export const sharePublicJobSchema = z.object({
  params: z.object({
    jobId: z.uuidv4('pub_003_share_v_01'),
  }),
});

export const sharePublicJobResponseSchema = z.object({
  studentJobId: z.string(),
  shareCount: z.number(),
});

export type SharePublicJobParams = z.infer<typeof sharePublicJobSchema>['params'];
export type SharePublicJobResponse = z.infer<typeof sharePublicJobResponseSchema>;
