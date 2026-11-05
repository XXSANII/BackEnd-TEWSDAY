import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { paymentStatusList, sessionStatusList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    searchClassSessionSchema
 * @code    me_007_s
 * @desc    Search class sessions of a booking schema
 *
 * ============================================================================
 */
export const searchClassSessionSortMap = {
  scheduledStart: 'scheduledStart',
  createdAt: 'createdAt',
} as const;
export const searchClassSessionValidSortKeys = Object.keys(searchClassSessionSortMap) as [string, ...string[]];

export const searchClassSessionSchema = z.object({
  params: z.object({
    bookingId: z.uuidv4('me_007_s_v_01'),
  }),
  body: z.object({
    status: z.enum(sessionStatusList, 'me_007_s_v_02').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchClassSessionValidSortKeys, 'scheduledStart').shape,
  }),
});

export const searchClassSessionResponseSchemaBody = z.object({
  classSessionId: z.string(),
  bookingId: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  actualStart: z.string().nullable(),
  actualEnd: z.string().nullable(),
  hourlyRate: z.number(),
  durationMinutes: z.number(),
  grossAmount: z.number(),
  lessonFeedback: z.string().nullable(),
  homeworkAssigned: z.string().nullable(),
  status: z.enum(sessionStatusList),
  paymentStatus: z.enum(paymentStatusList),
  disputeReason: z.string().nullable(),
  studentConfirmedAt: z.string().nullable(),
  tutorConfirmedAt: z.string().nullable(),
});

export const searchClassSessionResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchClassSessionResponseSchemaBody),
});

export type SearchClassSessionParams = z.infer<typeof searchClassSessionSchema>['params'];
export type SearchClassSessionInput = z.infer<typeof searchClassSessionSchema>['body'];
export type SearchClassSessionResponseBody = z.infer<typeof searchClassSessionResponseSchemaBody>;
export type SearchClassSessionResponse = z.infer<typeof searchClassSessionResponseSchema>;

/**
 * ============================================================================
 * @name    startClassSessionSchema
 * @code    me_007_start
 * @desc    Start class session schema
 *
 * ============================================================================
 */
export const startClassSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuidv4('me_007_start_v_01'),
  }),
});

export const startClassSessionResponseSchema = z.object({
  classSessionId: z.string(),
  status: z.enum(sessionStatusList),
  actualStart: z.string(),
});

export type StartClassSessionParams = z.infer<typeof startClassSessionSchema>['params'];
export type StartClassSessionResponse = z.infer<typeof startClassSessionResponseSchema>;

/**
 * ============================================================================
 * @name    completeClassSessionSchema
 * @code    me_007_complete
 * @desc    Complete class session schema
 *
 * ============================================================================
 */
export const completeClassSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuidv4('me_007_complete_v_01'),
  }),
  body: z.object({
    lessonFeedback: z.string('me_007_complete_v_02').max(3000, 'me_007_complete_v_02').optional().nullable(),
    homeworkAssigned: z.string('me_007_complete_v_03').max(3000, 'me_007_complete_v_03').optional().nullable(),
  }),
});

export const completeClassSessionResponseSchema = z.object({
  classSessionId: z.string(),
  status: z.enum(sessionStatusList),
  actualEnd: z.string(),
  completionClaimedAt: z.string(),
});

export type CompleteClassSessionParams = z.infer<typeof completeClassSessionSchema>['params'];
export type CompleteClassSessionInput = z.infer<typeof completeClassSessionSchema>['body'];
export type CompleteClassSessionResponse = z.infer<typeof completeClassSessionResponseSchema>;

/**
 * ============================================================================
 * @name    confirmSessionAttendanceSchema
 * @code    me_007_confirm
 * @desc    Confirm class session attendance schema
 *
 * ============================================================================
 */
export const confirmSessionAttendanceSchema = z.object({
  params: z.object({
    sessionId: z.uuidv4('me_007_confirm_v_01'),
  }),
});

export const confirmSessionAttendanceResponseSchema = z.object({
  classSessionId: z.string(),
  status: z.enum(sessionStatusList),
  paymentStatus: z.enum(paymentStatusList),
  studentConfirmedAt: z.string(),
});

export type ConfirmSessionAttendanceParams = z.infer<typeof confirmSessionAttendanceSchema>['params'];
export type ConfirmSessionAttendanceResponse = z.infer<typeof confirmSessionAttendanceResponseSchema>;

/**
 * ============================================================================
 * @name    disputeClassSessionSchema
 * @code    me_007_dispute
 * @desc    Dispute class session schema
 *
 * ============================================================================
 */
export const disputeClassSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuidv4('me_007_dispute_v_01'),
  }),
  body: z.object({
    disputeReason: z.string('me_007_dispute_v_02').min(5, 'me_007_dispute_v_03').max(2000, 'me_007_dispute_v_03'),
  }),
});

export const disputeClassSessionResponseSchema = z.object({
  classSessionId: z.string(),
  status: z.enum(sessionStatusList),
  disputeReason: z.string(),
});

export type DisputeClassSessionParams = z.infer<typeof disputeClassSessionSchema>['params'];
export type DisputeClassSessionInput = z.infer<typeof disputeClassSessionSchema>['body'];
export type DisputeClassSessionResponse = z.infer<typeof disputeClassSessionResponseSchema>;
