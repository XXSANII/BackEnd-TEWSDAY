import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import {
  declineReasonList,
  jobStatusList,
  recommendationActionList,
  recommendationTargetList,
  teachingLocationList,
  verificationStatusList,
} from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    searchRecommendedTutorSchema
 * @code    me_008_tutors_s
 * @desc    Search AI-recommended tutors schema
 *
 * ============================================================================
 */
export const searchRecommendedTutorSchema = z.object({
  body: z.object({
    studentJobId: z.uuidv4('me_008_tutors_s_v_01').optional(),
    subjectId: z.uuidv4('me_008_tutors_s_v_02').optional(),
    budgetMax: z.number('me_008_tutors_s_v_03').min(0, 'me_008_tutors_s_v_03').optional(),
    teachingLocationType: z.enum(teachingLocationList, 'me_008_tutors_s_v_04').optional(),
    latitude: z.number('me_008_tutors_s_v_05').min(-90, 'me_008_tutors_s_v_05').max(90, 'me_008_tutors_s_v_05').optional(),
    longitude: z.number('me_008_tutors_s_v_06').min(-180, 'me_008_tutors_s_v_06').max(180, 'me_008_tutors_s_v_06').optional(),
    ...paginationSchema.shape,
  }),
});

export const searchRecommendedTutorResponseSchemaBody = z.object({
  tutorProfileId: z.string(),
  userId: z.string(),
  displayName: z.string(),
  profileImageId: z.string().nullable(),
  bio: z.string().nullable(),
  hourlyRate: z.number().nullable(),
  teachingLocationType: z.enum(teachingLocationList),
  verificationStatus: z.enum(verificationStatusList),
  popularityScore: z.number(),
  matchScore: z.number(),
});

export const searchRecommendedTutorResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchRecommendedTutorResponseSchemaBody),
});

export type SearchRecommendedTutorInput = z.infer<typeof searchRecommendedTutorSchema>['body'];
export type SearchRecommendedTutorResponseBody = z.infer<typeof searchRecommendedTutorResponseSchemaBody>;
export type SearchRecommendedTutorResponse = z.infer<typeof searchRecommendedTutorResponseSchema>;

/**
 * ============================================================================
 * @name    searchRecommendedJobSchema
 * @code    me_008_jobs_s
 * @desc    Search AI-recommended student jobs schema
 *
 * ============================================================================
 */
export const searchRecommendedJobSchema = z.object({
  body: z.object({
    subjectId: z.uuidv4('me_008_jobs_s_v_01').optional(),
    locationType: z.enum(teachingLocationList, 'me_008_jobs_s_v_02').optional(),
    ...paginationSchema.shape,
  }),
});

export const searchRecommendedJobResponseSchemaBody = z.object({
  studentJobId: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  targetGradeLevel: z.string().nullable(),
  topics: z.array(z.string()),
  learningGoal: z.string().nullable(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  locationType: z.enum(teachingLocationList),
  status: z.enum(jobStatusList),
  matchScore: z.number(),
  createdAt: z.string(),
});

export const searchRecommendedJobResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchRecommendedJobResponseSchemaBody),
});

export type SearchRecommendedJobInput = z.infer<typeof searchRecommendedJobSchema>['body'];
export type SearchRecommendedJobResponseBody = z.infer<typeof searchRecommendedJobResponseSchemaBody>;
export type SearchRecommendedJobResponse = z.infer<typeof searchRecommendedJobResponseSchema>;

/**
 * ============================================================================
 * @name    createRecommendationFeedbackSchema
 * @code    me_008_feedback_c
 * @desc    Create recommendation feedback schema
 *
 * ============================================================================
 */
export const createRecommendationFeedbackSchema = z.object({
  body: z.object({
    targetType: z.enum(recommendationTargetList, 'me_008_feedback_c_v_01'),
    targetId: z.uuidv4('me_008_feedback_c_v_02'),
    action: z.enum(recommendationActionList, 'me_008_feedback_c_v_03'),
    declineReason: z.enum(declineReasonList, 'me_008_feedback_c_v_04').optional().nullable(),
    rankingVersion: z.string('me_008_feedback_c_v_05').max(50, 'me_008_feedback_c_v_05').optional().nullable(),
  }),
});

export const createRecommendationFeedbackResponseSchema = z.object({
  recommendationFeedbackId: z.string(),
  targetType: z.enum(recommendationTargetList),
  targetId: z.string(),
  action: z.enum(recommendationActionList),
});

export type CreateRecommendationFeedbackInput = z.infer<typeof createRecommendationFeedbackSchema>['body'];
export type CreateRecommendationFeedbackResponse = z.infer<typeof createRecommendationFeedbackResponseSchema>;
