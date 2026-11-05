import z from 'zod';
import { timeRegEx } from '@/utils/validation/regex';
import {
  changeRequestStatusList,
  introVideoStatusList,
  teachingLocationList,
  verificationStatusList,
} from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    getMyTutorProfileSchema
 * @code    me_003_g
 * @desc    Get current user tutor profile schema
 *
 * ============================================================================
 */
export const getMyTutorProfileSchema = z.object({
  query: z.object({}).optional(),
});

export const tutorSubjectItemSchema = z.object({
  tutorSubjectId: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  category: z.string(),
  proficiencyLevel: z.string().nullable(),
  gradeLevels: z.array(z.string()),
  specializedTopics: z.array(z.string()),
  customHourlyRate: z.number().nullable(),
});

export const tutorEducationItemSchema = z.object({
  tutorEducationId: z.string(),
  institution: z.string(),
  degree: z.string().nullable(),
  fieldOfStudy: z.string().nullable(),
  graduationYear: z.number().nullable(),
  verificationDocFileId: z.string().nullable(),
  isVerifiedFlag: z.boolean(),
});

export const getMyTutorProfileResponseSchema = z.object({
  tutorProfileId: z.string(),
  userId: z.string(),
  bio: z.string().nullable(),
  hourlyRate: z.number().nullable(),
  teachingLocationType: z.enum(teachingLocationList),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  serviceRadiusKm: z.number().nullable(),
  paymentDetails: z.record(z.string(), z.unknown()).nullable(),
  introVideoFileId: z.string().nullable(),
  introVideoStatus: z.enum(introVideoStatusList).nullable(),
  verificationStatus: z.enum(verificationStatusList),
  popularityScore: z.number(),
  subjects: z.array(tutorSubjectItemSchema),
  educations: z.array(tutorEducationItemSchema),
});

export type GetMyTutorProfileResponse = z.infer<typeof getMyTutorProfileResponseSchema>;

/**
 * ============================================================================
 * @name    editMyTutorProfileSchema
 * @code    me_003_e
 * @desc    Edit current user tutor profile schema
 *
 * ============================================================================
 */
export const editMyTutorProfileSchema = z.object({
  body: z.object({
    bio: z.string('me_003_e_v_01').max(5000, 'me_003_e_v_01').optional().nullable(),
    hourlyRate: z.number('me_003_e_v_02').min(0, 'me_003_e_v_02').optional().nullable(),
    teachingLocationType: z.enum(teachingLocationList, 'me_003_e_v_03').optional(),
    latitude: z.number('me_003_e_v_04').min(-90, 'me_003_e_v_04').max(90, 'me_003_e_v_04').optional().nullable(),
    longitude: z.number('me_003_e_v_05').min(-180, 'me_003_e_v_05').max(180, 'me_003_e_v_05').optional().nullable(),
    serviceRadiusKm: z.number('me_003_e_v_06').min(0, 'me_003_e_v_06').max(500, 'me_003_e_v_06').optional().nullable(),
    paymentDetails: z.record(z.string('me_003_e_v_07'), z.unknown()).optional().nullable(),
    introVideoFileId: z.uuidv4('me_003_e_v_08').optional().nullable(),
    subjects: z
      .array(
        z.object({
          subjectId: z.uuidv4('me_003_e_v_09'),
          proficiencyLevel: z.string('me_003_e_v_10').optional().nullable(),
          gradeLevels: z.array(z.string('me_003_e_v_11')).optional(),
          specializedTopics: z.array(z.string('me_003_e_v_12')).optional(),
          customHourlyRate: z.number('me_003_e_v_13').min(0, 'me_003_e_v_13').optional().nullable(),
        })
      )
      .optional(),
  }),
});

export const editMyTutorProfileResponseSchema = z.object({
  tutorProfileId: z.string(),
});

export type EditMyTutorProfileInput = z.infer<typeof editMyTutorProfileSchema>['body'];
export type EditMyTutorProfileResponse = z.infer<typeof editMyTutorProfileResponseSchema>;

/**
 * ============================================================================
 * @name    createTutorEducationSchema
 * @code    me_003_edu_c
 * @desc    Create tutor education record schema
 *
 * ============================================================================
 */
export const createTutorEducationSchema = z.object({
  body: z.object({
    institution: z.string('me_003_edu_c_v_01').min(1, 'me_003_edu_c_v_02').max(150, 'me_003_edu_c_v_02'),
    degree: z.string('me_003_edu_c_v_03').max(150, 'me_003_edu_c_v_03').optional().nullable(),
    fieldOfStudy: z.string('me_003_edu_c_v_04').max(150, 'me_003_edu_c_v_04').optional().nullable(),
    graduationYear: z
      .number('me_003_edu_c_v_05')
      .int('me_003_edu_c_v_05')
      .min(1950, 'me_003_edu_c_v_05')
      .max(2100, 'me_003_edu_c_v_05')
      .optional()
      .nullable(),
    verificationDocFileId: z.uuidv4('me_003_edu_c_v_06').optional().nullable(),
  }),
});

export const createTutorEducationResponseSchema = tutorEducationItemSchema;

export type CreateTutorEducationInput = z.infer<typeof createTutorEducationSchema>['body'];
export type CreateTutorEducationResponse = z.infer<typeof createTutorEducationResponseSchema>;

/**
 * ============================================================================
 * @name    deleteTutorEducationSchema
 * @code    me_003_edu_d
 * @desc    Delete tutor education record schema
 *
 * ============================================================================
 */
export const deleteTutorEducationSchema = z.object({
  params: z.object({
    eduId: z.uuidv4('me_003_edu_d_v_01'),
  }),
});

export const deleteTutorEducationResponseSchema = z.object({
  tutorEducationId: z.string(),
});

export type DeleteTutorEducationParams = z.infer<typeof deleteTutorEducationSchema>['params'];
export type DeleteTutorEducationResponse = z.infer<typeof deleteTutorEducationResponseSchema>;

/**
 * ============================================================================
 * @name    getTutorAvailabilitySchema
 * @code    me_003_avail_g
 * @desc    Get tutor availability slots schema
 *
 * ============================================================================
 */
export const getTutorAvailabilitySchema = z.object({
  query: z.object({}).optional(),
});

export const tutorAvailabilityItemSchema = z.object({
  tutorAvailabilityId: z.string(),
  dayOfWeek: z.number().nullable(),
  specificDate: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  isAvailableFlag: z.boolean(),
});

export const getTutorAvailabilityResponseSchema = z.object({
  tutorProfileId: z.string(),
  slots: z.array(tutorAvailabilityItemSchema),
});

export type GetTutorAvailabilityResponse = z.infer<typeof getTutorAvailabilityResponseSchema>;

/**
 * ============================================================================
 * @name    editTutorAvailabilitySchema
 * @code    me_003_avail_e
 * @desc    Edit tutor availability slots schema
 *
 * ============================================================================
 */
export const editTutorAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(
      z.object({
        dayOfWeek: z
          .number('me_003_avail_e_v_01')
          .int('me_003_avail_e_v_01')
          .min(0, 'me_003_avail_e_v_01')
          .max(6, 'me_003_avail_e_v_01')
          .optional()
          .nullable(),
        specificDate: z.string('me_003_avail_e_v_02').optional().nullable(),
        startTime: z.string('me_003_avail_e_v_03').regex(timeRegEx, 'me_003_avail_e_v_04'),
        endTime: z.string('me_003_avail_e_v_05').regex(timeRegEx, 'me_003_avail_e_v_06'),
        isAvailableFlag: z.boolean('me_003_avail_e_v_07').optional(),
      })
    ),
  }),
});

export const editTutorAvailabilityResponseSchema = z.object({
  tutorProfileId: z.string(),
  slots: z.array(tutorAvailabilityItemSchema),
});

export type EditTutorAvailabilityInput = z.infer<typeof editTutorAvailabilitySchema>['body'];
export type EditTutorAvailabilityResponse = z.infer<typeof editTutorAvailabilityResponseSchema>;

/**
 * ============================================================================
 * @name    createProfileChangeRequestSchema
 * @code    me_003_req_c
 * @desc    Create tutor profile change request schema
 *
 * ============================================================================
 */
export const createProfileChangeRequestSchema = z.object({
  body: z.object({
    requestedChanges: z.record(z.string('me_003_req_c_v_01'), z.unknown()),
    supportingDocFileId: z.uuidv4('me_003_req_c_v_02').optional().nullable(),
  }),
});

export const createProfileChangeRequestResponseSchema = z.object({
  profileChangeRequestId: z.string(),
  status: z.enum(changeRequestStatusList),
  createdAt: z.string(),
});

export type CreateProfileChangeRequestInput = z.infer<typeof createProfileChangeRequestSchema>['body'];
export type CreateProfileChangeRequestResponse = z.infer<typeof createProfileChangeRequestResponseSchema>;
