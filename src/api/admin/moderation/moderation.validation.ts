import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { invoiceStatusList } from '@/constants/billing.constants';
import {
  changeRequestStatusList,
  introVideoStatusList,
  paymentStatusList,
  sessionStatusList,
  verificationStatusList,
} from '@/constants/marketplace.constants';
import { userStatusList } from '@/constants/user.constants';

/**
 * ============================================================================
 * @name    searchTutorVerificationSchema
 * @code    adm_001_s
 * @desc    Search tutor verification queue schema
 *
 * ============================================================================
 */
export const searchTutorVerificationSortMap = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
} as const;
export const searchTutorVerificationValidSortKeys = Object.keys(searchTutorVerificationSortMap) as [
  string,
  ...string[],
];

export const searchTutorVerificationSchema = z.object({
  body: z.object({
    verificationStatus: z.enum(verificationStatusList, 'adm_001_s_v_01').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchTutorVerificationValidSortKeys, 'createdAt').shape,
  }),
});

export const searchTutorVerificationResponseSchemaBody = z.object({
  tutorProfileId: z.string(),
  userId: z.string(),
  displayName: z.string(),
  email: z.string(),
  verificationStatus: z.enum(verificationStatusList),
  introVideoFileId: z.string().nullable(),
  introVideoStatus: z.enum(introVideoStatusList).nullable(),
  createdAt: z.string(),
});

export const searchTutorVerificationResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchTutorVerificationResponseSchemaBody),
});

export type SearchTutorVerificationInput = z.infer<typeof searchTutorVerificationSchema>['body'];
export type SearchTutorVerificationResponseBody = z.infer<typeof searchTutorVerificationResponseSchemaBody>;
export type SearchTutorVerificationResponse = z.infer<typeof searchTutorVerificationResponseSchema>;

/**
 * ============================================================================
 * @name    verifyTutorProfileSchema
 * @code    adm_001_verify
 * @desc    Approve or reject tutor verification schema
 *
 * ============================================================================
 */
export const verifyTutorProfileSchema = z.object({
  params: z.object({
    tutorId: z.uuidv4('adm_001_verify_v_01'),
  }),
  body: z.object({
    verificationStatus: z.enum(verificationStatusList, 'adm_001_verify_v_02'),
    introVideoStatus: z.enum(introVideoStatusList, 'adm_001_verify_v_03').optional().nullable(),
  }),
});

export const verifyTutorProfileResponseSchema = z.object({
  tutorProfileId: z.string(),
  verificationStatus: z.enum(verificationStatusList),
  introVideoStatus: z.enum(introVideoStatusList).nullable(),
});

export type VerifyTutorProfileParams = z.infer<typeof verifyTutorProfileSchema>['params'];
export type VerifyTutorProfileInput = z.infer<typeof verifyTutorProfileSchema>['body'];
export type VerifyTutorProfileResponse = z.infer<typeof verifyTutorProfileResponseSchema>;

/**
 * ============================================================================
 * @name    searchChangeRequestSchema
 * @code    adm_002_s
 * @desc    Search tutor profile change requests schema
 *
 * ============================================================================
 */
export const searchChangeRequestSortMap = {
  createdAt: 'createdAt',
} as const;
export const searchChangeRequestValidSortKeys = Object.keys(searchChangeRequestSortMap) as [string, ...string[]];

export const searchChangeRequestSchema = z.object({
  body: z.object({
    status: z.enum(changeRequestStatusList, 'adm_002_s_v_01').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchChangeRequestValidSortKeys, 'createdAt').shape,
  }),
});

export const searchChangeRequestResponseSchemaBody = z.object({
  profileChangeRequestId: z.string(),
  tutorProfileId: z.string(),
  requestedChanges: z.record(z.string(), z.unknown()),
  supportingDocFileId: z.string().nullable(),
  status: z.enum(changeRequestStatusList),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string(),
});

export const searchChangeRequestResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchChangeRequestResponseSchemaBody),
});

export type SearchChangeRequestInput = z.infer<typeof searchChangeRequestSchema>['body'];
export type SearchChangeRequestResponseBody = z.infer<typeof searchChangeRequestResponseSchemaBody>;
export type SearchChangeRequestResponse = z.infer<typeof searchChangeRequestResponseSchema>;

/**
 * ============================================================================
 * @name    resolveChangeRequestSchema
 * @code    adm_002_resolve
 * @desc    Resolve tutor profile change request schema
 *
 * ============================================================================
 */
export const resolveChangeRequestSchema = z.object({
  params: z.object({
    requestId: z.uuidv4('adm_002_resolve_v_01'),
  }),
  body: z.object({
    status: z.enum(changeRequestStatusList, 'adm_002_resolve_v_02'),
    rejectionReason: z.string('adm_002_resolve_v_03').max(1000, 'adm_002_resolve_v_03').optional().nullable(),
  }),
});

export const resolveChangeRequestResponseSchema = z.object({
  profileChangeRequestId: z.string(),
  status: z.enum(changeRequestStatusList),
  reviewedAt: z.string(),
});

export type ResolveChangeRequestParams = z.infer<typeof resolveChangeRequestSchema>['params'];
export type ResolveChangeRequestInput = z.infer<typeof resolveChangeRequestSchema>['body'];
export type ResolveChangeRequestResponse = z.infer<typeof resolveChangeRequestResponseSchema>;

/**
 * ============================================================================
 * @name    searchCommissionInvoiceSchema
 * @code    adm_004_s
 * @desc    Search commission invoices schema
 *
 * ============================================================================
 */
export const searchCommissionInvoiceSortMap = {
  createdAt: 'createdAt',
  dueDate: 'dueDate',
  amount: 'amount',
} as const;
export const searchCommissionInvoiceValidSortKeys = Object.keys(searchCommissionInvoiceSortMap) as [
  string,
  ...string[],
];

export const searchCommissionInvoiceSchema = z.object({
  body: z.object({
    status: z.enum(invoiceStatusList, 'adm_004_s_v_01').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchCommissionInvoiceValidSortKeys, 'createdAt').shape,
  }),
});

export const searchCommissionInvoiceResponseSchemaBody = z.object({
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  payerUserId: z.string(),
  amount: z.number(),
  commissionFee: z.number(),
  status: z.enum(invoiceStatusList),
  slipFileId: z.string().nullable(),
  dueDate: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
});

export const searchCommissionInvoiceResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchCommissionInvoiceResponseSchemaBody),
});

export type SearchCommissionInvoiceInput = z.infer<typeof searchCommissionInvoiceSchema>['body'];
export type SearchCommissionInvoiceResponseBody = z.infer<typeof searchCommissionInvoiceResponseSchemaBody>;
export type SearchCommissionInvoiceResponse = z.infer<typeof searchCommissionInvoiceResponseSchema>;

/**
 * ============================================================================
 * @name    verifyInvoiceSlipSchema
 * @code    adm_004_verify
 * @desc    Verify or reject invoice payment slip schema
 *
 * ============================================================================
 */
export const verifyInvoiceSlipSchema = z.object({
  params: z.object({
    invoiceId: z.uuidv4('adm_004_verify_v_01'),
  }),
  body: z.object({
    status: z.enum(invoiceStatusList, 'adm_004_verify_v_02'),
  }),
});

export const verifyInvoiceSlipResponseSchema = z.object({
  invoiceId: z.string(),
  status: z.enum(invoiceStatusList),
  verifiedBy: z.string().nullable(),
});

export type VerifyInvoiceSlipParams = z.infer<typeof verifyInvoiceSlipSchema>['params'];
export type VerifyInvoiceSlipInput = z.infer<typeof verifyInvoiceSlipSchema>['body'];
export type VerifyInvoiceSlipResponse = z.infer<typeof verifyInvoiceSlipResponseSchema>;

/**
 * ============================================================================
 * @name    searchDisputeSchema
 * @code    adm_005_s
 * @desc    Search disputed class sessions schema
 *
 * ============================================================================
 */
export const searchDisputeSortMap = {
  createdAt: 'createdAt',
  scheduledStart: 'scheduledStart',
} as const;
export const searchDisputeValidSortKeys = Object.keys(searchDisputeSortMap) as [string, ...string[]];

export const searchDisputeSchema = z.object({
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchDisputeValidSortKeys, 'createdAt').shape,
  }),
});

export const searchDisputeResponseSchemaBody = z.object({
  classSessionId: z.string(),
  bookingId: z.string(),
  studentProfileId: z.string(),
  tutorProfileId: z.string(),
  grossAmount: z.number(),
  status: z.enum(sessionStatusList),
  paymentStatus: z.enum(paymentStatusList),
  disputeReason: z.string().nullable(),
  createdAt: z.string(),
});

export const searchDisputeResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchDisputeResponseSchemaBody),
});

export type SearchDisputeInput = z.infer<typeof searchDisputeSchema>['body'];
export type SearchDisputeResponseBody = z.infer<typeof searchDisputeResponseSchemaBody>;
export type SearchDisputeResponse = z.infer<typeof searchDisputeResponseSchema>;

/**
 * ============================================================================
 * @name    resolveDisputeSchema
 * @code    adm_005_resolve
 * @desc    Resolve disputed class session schema
 *
 * ============================================================================
 */
export const resolveDisputeSchema = z.object({
  params: z.object({
    disputeId: z.uuidv4('adm_005_resolve_v_01'),
  }),
  body: z.object({
    status: z.enum(sessionStatusList, 'adm_005_resolve_v_02'),
    paymentStatus: z.enum(paymentStatusList, 'adm_005_resolve_v_03'),
  }),
});

export const resolveDisputeResponseSchema = z.object({
  classSessionId: z.string(),
  status: z.enum(sessionStatusList),
  paymentStatus: z.enum(paymentStatusList),
});

export type ResolveDisputeParams = z.infer<typeof resolveDisputeSchema>['params'];
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>['body'];
export type ResolveDisputeResponse = z.infer<typeof resolveDisputeResponseSchema>;

/**
 * ============================================================================
 * @name    suspendUserSchema
 * @code    adm_006_suspend
 * @desc    Suspend or update user account status schema
 *
 * ============================================================================
 */
export const suspendUserSchema = z.object({
  params: z.object({
    userId: z.uuidv4('adm_006_suspend_v_01'),
  }),
  body: z.object({
    status: z.enum(userStatusList, 'adm_006_suspend_v_02'),
  }),
});

export const suspendUserResponseSchema = z.object({
  userId: z.string(),
  status: z.enum(userStatusList),
});

export type SuspendUserParams = z.infer<typeof suspendUserSchema>['params'];
export type SuspendUserInput = z.infer<typeof suspendUserSchema>['body'];
export type SuspendUserResponse = z.infer<typeof suspendUserResponseSchema>;
