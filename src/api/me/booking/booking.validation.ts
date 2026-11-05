import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { bookingStatusList, teachingModeList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    createBookingSchema
 * @code    me_006_c
 * @desc    Create booking schema
 *
 * ============================================================================
 */
export const createBookingSchema = z.object({
  body: z.object({
    tutorProfileId: z.uuidv4('me_006_c_v_01'),
    subjectId: z.uuidv4('me_006_c_v_02'),
    originatingStudentJobId: z.uuidv4('me_006_c_v_03').optional().nullable(),
    agreedHourlyRate: z.number('me_006_c_v_04').min(0, 'me_006_c_v_05'),
    teachingMode: z.enum(teachingModeList, 'me_006_c_v_06'),
    meetingLocation: z.string('me_006_c_v_07').max(500, 'me_006_c_v_07').optional().nullable(),
    meetingUrl: z.string('me_006_c_v_08').max(500, 'me_006_c_v_08').optional().nullable(),
    signedContractFileId: z.uuidv4('me_006_c_v_09').optional().nullable(),
    sessions: z
      .array(
        z.object({
          scheduledStart: z.string('me_006_c_v_10'),
          scheduledEnd: z.string('me_006_c_v_11'),
          durationMinutes: z.number('me_006_c_v_12').int('me_006_c_v_12').min(15, 'me_006_c_v_12'),
        })
      )
      .optional(),
  }),
});

export const createBookingResponseSchema = z.object({
  bookingId: z.string(),
  status: z.enum(bookingStatusList),
  createdSessionsCount: z.number(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type CreateBookingResponse = z.infer<typeof createBookingResponseSchema>;

/**
 * ============================================================================
 * @name    searchBookingSchema
 * @code    me_006_s
 * @desc    Search bookings schema
 *
 * ============================================================================
 */
export const searchBookingSortMap = {
  createdAt: 'createdAt',
  agreedHourlyRate: 'agreedHourlyRate',
} as const;
export const searchBookingValidSortKeys = Object.keys(searchBookingSortMap) as [string, ...string[]];

export const searchBookingSchema = z.object({
  body: z.object({
    status: z.enum(bookingStatusList, 'me_006_s_v_01').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchBookingValidSortKeys, 'createdAt').shape,
  }),
});

export const searchBookingResponseSchemaBody = z.object({
  bookingId: z.string(),
  studentProfileId: z.string(),
  studentDisplayName: z.string(),
  tutorProfileId: z.string(),
  tutorDisplayName: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  agreedHourlyRate: z.number(),
  teachingMode: z.enum(teachingModeList),
  status: z.enum(bookingStatusList),
  createdAt: z.string(),
});

export const searchBookingResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchBookingResponseSchemaBody),
});

export type SearchBookingInput = z.infer<typeof searchBookingSchema>['body'];
export type SearchBookingResponseBody = z.infer<typeof searchBookingResponseSchemaBody>;
export type SearchBookingResponse = z.infer<typeof searchBookingResponseSchema>;

/**
 * ============================================================================
 * @name    getBookingSchema
 * @code    me_006_g
 * @desc    Get booking details schema
 *
 * ============================================================================
 */
export const getBookingSchema = z.object({
  params: z.object({
    bookingId: z.uuidv4('me_006_g_v_01'),
  }),
});

export const getBookingResponseSchema = z.object({
  bookingId: z.string(),
  studentProfileId: z.string(),
  studentDisplayName: z.string(),
  tutorProfileId: z.string(),
  tutorDisplayName: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  originatingStudentJobId: z.string().nullable(),
  agreedHourlyRate: z.number(),
  teachingMode: z.enum(teachingModeList),
  meetingLocation: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  signedContractFileId: z.string().nullable(),
  contractUploadedAt: z.string().nullable(),
  tutorPaymentDetails: z.record(z.string(), z.unknown()).nullable(),
  status: z.enum(bookingStatusList),
  createdAt: z.string(),
});

export type GetBookingParams = z.infer<typeof getBookingSchema>['params'];
export type GetBookingResponse = z.infer<typeof getBookingResponseSchema>;

/**
 * ============================================================================
 * @name    cancelBookingSchema
 * @code    me_006_cancel
 * @desc    Cancel booking schema
 *
 * ============================================================================
 */
export const cancelBookingSchema = z.object({
  params: z.object({
    bookingId: z.uuidv4('me_006_cancel_v_01'),
  }),
  body: z.object({
    reason: z.string('me_006_cancel_v_02').max(1000, 'me_006_cancel_v_02').optional().nullable(),
  }),
});

export const cancelBookingResponseSchema = z.object({
  bookingId: z.string(),
  status: z.enum(bookingStatusList),
});

export type CancelBookingParams = z.infer<typeof cancelBookingSchema>['params'];
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>['body'];
export type CancelBookingResponse = z.infer<typeof cancelBookingResponseSchema>;
