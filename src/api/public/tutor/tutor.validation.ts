import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { teachingLocationList, verificationStatusList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    searchTutorSchema
 * @code    pub_002_s
 * @desc    Search public tutors schema
 *
 * ============================================================================
 */
export const searchTutorSortMap = {
  popularityScore: 'popularityScore',
  hourlyRate: 'hourlyRate',
  createdAt: 'createdAt',
} as const;
export const searchTutorValidSortKeys = Object.keys(searchTutorSortMap) as [string, ...string[]];

export const searchTutorSchema = z.object({
  body: z.object({
    keyword: z.string('pub_002_s_v_01').optional(),
    subjectId: z.uuidv4('pub_002_s_v_02').optional(),
    teachingLocationType: z.enum(teachingLocationList, 'pub_002_s_v_03').optional(),
    minHourlyRate: z.number('pub_002_s_v_04').min(0, 'pub_002_s_v_04').optional(),
    maxHourlyRate: z.number('pub_002_s_v_05').min(0, 'pub_002_s_v_05').optional(),
    latitude: z.number('pub_002_s_v_06').min(-90, 'pub_002_s_v_06').max(90, 'pub_002_s_v_06').optional(),
    longitude: z.number('pub_002_s_v_07').min(-180, 'pub_002_s_v_07').max(180, 'pub_002_s_v_07').optional(),
    radiusKm: z.number('pub_002_s_v_08').min(0, 'pub_002_s_v_08').max(500, 'pub_002_s_v_08').optional(),
    verifiedOnlyFlag: z.boolean('pub_002_s_v_09').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchTutorValidSortKeys, 'popularityScore').shape,
  }),
});

export const searchTutorResponseSchemaBody = z.object({
  tutorProfileId: z.string(),
  userId: z.string(),
  displayName: z.string(),
  profileImageId: z.string().nullable(),
  bio: z.string().nullable(),
  hourlyRate: z.number().nullable(),
  teachingLocationType: z.enum(teachingLocationList),
  verificationStatus: z.enum(verificationStatusList),
  popularityScore: z.number(),
  averageRating: z.number(),
  reviewCount: z.number(),
  distanceKm: z.number().nullable(),
});

export const searchTutorResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchTutorResponseSchemaBody),
});

export type SearchTutorInput = z.infer<typeof searchTutorSchema>['body'];
export type SearchTutorResponseBody = z.infer<typeof searchTutorResponseSchemaBody>;
export type SearchTutorResponse = z.infer<typeof searchTutorResponseSchema>;

/**
 * ============================================================================
 * @name    getTutorSchema
 * @code    pub_002_g
 * @desc    Get public tutor profile schema
 *
 * ============================================================================
 */
export const getTutorSchema = z.object({
  params: z.object({
    tutorId: z.uuidv4('pub_002_g_v_01'),
  }),
});

export const getTutorResponseSchema = z.object({
  tutorProfileId: z.string(),
  userId: z.string(),
  displayName: z.string(),
  profileImageId: z.string().nullable(),
  bio: z.string().nullable(),
  hourlyRate: z.number().nullable(),
  teachingLocationType: z.enum(teachingLocationList),
  serviceRadiusKm: z.number().nullable(),
  introVideoFileId: z.string().nullable(),
  verificationStatus: z.enum(verificationStatusList),
  popularityScore: z.number(),
  averageRating: z.number(),
  reviewCount: z.number(),
  subjects: z.array(
    z.object({
      tutorSubjectId: z.string(),
      subjectId: z.string(),
      subjectName: z.string(),
      category: z.string(),
      proficiencyLevel: z.string().nullable(),
      gradeLevels: z.array(z.string()),
      specializedTopics: z.array(z.string()),
      customHourlyRate: z.number().nullable(),
    })
  ),
  educations: z.array(
    z.object({
      tutorEducationId: z.string(),
      institution: z.string(),
      degree: z.string().nullable(),
      fieldOfStudy: z.string().nullable(),
      graduationYear: z.number().nullable(),
      isVerifiedFlag: z.boolean(),
    })
  ),
});

export type GetTutorParams = z.infer<typeof getTutorSchema>['params'];
export type GetTutorResponse = z.infer<typeof getTutorResponseSchema>;

/**
 * ============================================================================
 * @name    getPublicTutorAvailabilitySchema
 * @code    pub_002_avail_g
 * @desc    Get public tutor availability schema
 *
 * ============================================================================
 */
export const getPublicTutorAvailabilitySchema = z.object({
  params: z.object({
    tutorId: z.uuidv4('pub_002_avail_g_v_01'),
  }),
});

export const getPublicTutorAvailabilityResponseSchema = z.object({
  tutorProfileId: z.string(),
  slots: z.array(
    z.object({
      tutorAvailabilityId: z.string(),
      dayOfWeek: z.number().nullable(),
      specificDate: z.string().nullable(),
      startTime: z.string(),
      endTime: z.string(),
      isAvailableFlag: z.boolean(),
    })
  ),
});

export type GetPublicTutorAvailabilityParams = z.infer<typeof getPublicTutorAvailabilitySchema>['params'];
export type GetPublicTutorAvailabilityResponse = z.infer<typeof getPublicTutorAvailabilityResponseSchema>;

/**
 * ============================================================================
 * @name    searchTutorReviewSchema
 * @code    pub_002_rev_s
 * @desc    Search public tutor reviews schema
 *
 * ============================================================================
 */
export const searchTutorReviewSortMap = {
  createdAt: 'createdAt',
  ratingScore: 'ratingScore',
} as const;
export const searchTutorReviewValidSortKeys = Object.keys(searchTutorReviewSortMap) as [string, ...string[]];

export const searchTutorReviewSchema = z.object({
  params: z.object({
    tutorId: z.uuidv4('pub_002_rev_s_v_01'),
  }),
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchTutorReviewValidSortKeys, 'createdAt').shape,
  }),
});

export const searchTutorReviewResponseSchemaBody = z.object({
  reviewId: z.string(),
  reviewerDisplayName: z.string(),
  ratingScore: z.number(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

export const searchTutorReviewResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchTutorReviewResponseSchemaBody),
});

export type SearchTutorReviewParams = z.infer<typeof searchTutorReviewSchema>['params'];
export type SearchTutorReviewInput = z.infer<typeof searchTutorReviewSchema>['body'];
export type SearchTutorReviewResponseBody = z.infer<typeof searchTutorReviewResponseSchemaBody>;
export type SearchTutorReviewResponse = z.infer<typeof searchTutorReviewResponseSchema>;
