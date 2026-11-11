import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { applicationStatusList, jobStatusList, teachingLocationList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    createStudentJobSchema
 * @code    me_005_c
 * @desc    Create student job schema
 *
 * ============================================================================
 */
export const createStudentJobSchema = z.object({
  body: z.object({
    subjectId: z.uuidv4('me_005_c_v_01'),
    targetGradeLevel: z.string('me_005_c_v_02').max(50, 'me_005_c_v_02').optional().nullable(),
    topics: z.array(z.string('me_005_c_v_03')).optional(),
    learningGoal: z.string('me_005_c_v_04').max(3000, 'me_005_c_v_04').optional().nullable(),
    budgetMin: z.number('me_005_c_v_05').min(0, 'me_005_c_v_05').optional().nullable(),
    budgetMax: z.number('me_005_c_v_06').min(0, 'me_005_c_v_06').optional().nullable(),
    locationType: z.enum(teachingLocationList, 'me_005_c_v_07'),
    latitude: z.number('me_005_c_v_08').min(-90, 'me_005_c_v_08').max(90, 'me_005_c_v_08').optional().nullable(),
    longitude: z.number('me_005_c_v_09').min(-180, 'me_005_c_v_09').max(180, 'me_005_c_v_09').optional().nullable(),
    frequencyPerWeek: z
      .number('me_005_c_v_10')
      .int('me_005_c_v_10')
      .min(1, 'me_005_c_v_10')
      .max(14, 'me_005_c_v_10')
      .optional()
      .nullable(),
    preferredDays: z.unknown().optional().nullable(),
  }),
});

export const createStudentJobResponseSchema = z.object({
  studentJobId: z.string(),
  status: z.enum(jobStatusList),
  expiredAt: z.string().nullable(),
});

export type CreateStudentJobInput = z.infer<typeof createStudentJobSchema>['body'];
export type CreateStudentJobResponse = z.infer<typeof createStudentJobResponseSchema>;

/**
 * ============================================================================
 * @name    editStudentJobStatusSchema
 * @code    me_005_status_e
 * @desc    Edit student job status schema
 *
 * ============================================================================
 */
export const editStudentJobStatusSchema = z.object({
  params: z.object({
    jobId: z.uuidv4('me_005_status_e_v_01'),
  }),
  body: z.object({
    status: z.enum(jobStatusList, 'me_005_status_e_v_02'),
  }),
});

export const editStudentJobStatusResponseSchema = z.object({
  studentJobId: z.string(),
  status: z.enum(jobStatusList),
});

export type EditStudentJobStatusParams = z.infer<typeof editStudentJobStatusSchema>['params'];
export type EditStudentJobStatusInput = z.infer<typeof editStudentJobStatusSchema>['body'];
export type EditStudentJobStatusResponse = z.infer<typeof editStudentJobStatusResponseSchema>;

/**
 * ============================================================================
 * @name    searchJobApplicationSchema
 * @code    me_005_apps_s
 * @desc    Search job applications schema
 *
 * ============================================================================
 */
export const searchJobApplicationSortMap = {
  createdAt: 'createdAt',
  proposedRate: 'proposedRate',
} as const;
export const searchJobApplicationValidSortKeys = Object.keys(searchJobApplicationSortMap) as [string, ...string[]];

export const searchJobApplicationSchema = z.object({
  params: z.object({
    jobId: z.uuidv4('me_005_apps_s_v_01'),
  }),
  body: z.object({
    status: z.enum(applicationStatusList, 'me_005_apps_s_v_02').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchJobApplicationValidSortKeys, 'createdAt').shape,
  }),
});

export const searchJobApplicationResponseSchemaBody = z.object({
  jobApplicationId: z.string(),
  studentJobId: z.string(),
  tutorProfileId: z.string(),
  tutorDisplayName: z.string(),
  tutorProfileImageId: z.string().nullable(),
  proposedRate: z.number(),
  proposedAvailability: z.unknown().nullable(),
  coverMessage: z.string().nullable(),
  status: z.enum(applicationStatusList),
  createdAt: z.string(),
});

export const searchJobApplicationResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchJobApplicationResponseSchemaBody),
});

export type SearchJobApplicationParams = z.infer<typeof searchJobApplicationSchema>['params'];
export type SearchJobApplicationInput = z.infer<typeof searchJobApplicationSchema>['body'];
export type SearchJobApplicationResponseBody = z.infer<typeof searchJobApplicationResponseSchemaBody>;
export type SearchJobApplicationResponse = z.infer<typeof searchJobApplicationResponseSchema>;

/**
 * ============================================================================
 * @name    applyStudentJobSchema
 * @code    me_005_apply_c
 * @desc    Apply for student job schema
 *
 * ============================================================================
 */
export const applyStudentJobSchema = z.object({
  params: z.object({
    jobId: z.uuidv4('me_005_apply_c_v_01'),
  }),
  body: z.object({
    proposedRate: z.number('me_005_apply_c_v_02').min(0, 'me_005_apply_c_v_03'),
    proposedAvailability: z.unknown().optional().nullable(),
    coverMessage: z.string('me_005_apply_c_v_04').max(2000, 'me_005_apply_c_v_04').optional().nullable(),
  }),
});

export const applyStudentJobResponseSchema = z.object({
  jobApplicationId: z.string(),
  studentJobId: z.string(),
  status: z.enum(applicationStatusList),
});

export type ApplyStudentJobParams = z.infer<typeof applyStudentJobSchema>['params'];
export type ApplyStudentJobInput = z.infer<typeof applyStudentJobSchema>['body'];
export type ApplyStudentJobResponse = z.infer<typeof applyStudentJobResponseSchema>;

/**
 * ============================================================================
 * @name    editJobApplicationStatusSchema
 * @code    me_005_app_status_e
 * @desc    Edit job application status schema
 *
 * ============================================================================
 */
export const editJobApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.uuidv4('me_005_app_status_e_v_01'),
  }),
  body: z.object({
    status: z.enum(applicationStatusList, 'me_005_app_status_e_v_02'),
  }),
});

export const editJobApplicationStatusResponseSchema = z.object({
  jobApplicationId: z.string(),
  status: z.enum(applicationStatusList),
  bookingId: z.string().nullable(),
});

export type EditJobApplicationStatusParams = z.infer<typeof editJobApplicationStatusSchema>['params'];
export type EditJobApplicationStatusInput = z.infer<typeof editJobApplicationStatusSchema>['body'];
export type EditJobApplicationStatusResponse = z.infer<typeof editJobApplicationStatusResponseSchema>;
