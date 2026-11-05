import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import {
  invoiceStatusList,
  invoiceTypeList,
  paymentMethodList,
} from '@/constants/billing.constants';

/**
 * ============================================================================
 * @name    searchInvoiceSchema
 * @code    me_009_s
 * @desc    Search user invoices schema
 *
 * ============================================================================
 */
export const searchInvoiceSortMap = {
  createdAt: 'createdAt',
  dueDate: 'dueDate',
  amount: 'amount',
} as const;
export const searchInvoiceValidSortKeys = Object.keys(searchInvoiceSortMap) as [string, ...string[]];

export const searchInvoiceSchema = z.object({
  body: z.object({
    invoiceType: z.enum(invoiceTypeList, 'me_009_s_v_01').optional(),
    status: z.enum(invoiceStatusList, 'me_009_s_v_02').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchInvoiceValidSortKeys, 'createdAt').shape,
  }),
});

export const searchInvoiceResponseSchemaBody = z.object({
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  invoiceType: z.enum(invoiceTypeList),
  bookingId: z.string().nullable(),
  classSessionId: z.string().nullable(),
  payerUserId: z.string(),
  payeeUserId: z.string(),
  amount: z.number(),
  commissionFee: z.number(),
  status: z.enum(invoiceStatusList),
  paymentMethod: z.enum(paymentMethodList).nullable(),
  slipFileId: z.string().nullable(),
  dueDate: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
});

export const searchInvoiceResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchInvoiceResponseSchemaBody),
});

export type SearchInvoiceInput = z.infer<typeof searchInvoiceSchema>['body'];
export type SearchInvoiceResponseBody = z.infer<typeof searchInvoiceResponseSchemaBody>;
export type SearchInvoiceResponse = z.infer<typeof searchInvoiceResponseSchema>;

/**
 * ============================================================================
 * @name    getInvoiceSchema
 * @code    me_009_g
 * @desc    Get invoice details schema
 *
 * ============================================================================
 */
export const getInvoiceSchema = z.object({
  params: z.object({
    invoiceId: z.uuidv4('me_009_g_v_01'),
  }),
});

export const getInvoiceResponseSchema = z.object({
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  invoiceType: z.enum(invoiceTypeList),
  bookingId: z.string().nullable(),
  classSessionId: z.string().nullable(),
  payerUserId: z.string(),
  payeeUserId: z.string(),
  billingPeriodStart: z.string().nullable(),
  billingPeriodEnd: z.string().nullable(),
  commissionRateSnapshot: z.number().nullable(),
  amount: z.number(),
  commissionFee: z.number(),
  status: z.enum(invoiceStatusList),
  paymentMethod: z.enum(paymentMethodList).nullable(),
  slipFileId: z.string().nullable(),
  dueDate: z.string().nullable(),
  paidAt: z.string().nullable(),
  verifiedBy: z.string().nullable(),
  createdAt: z.string(),
  items: z.array(
    z.object({
      invoiceItemId: z.string(),
      classSessionId: z.string(),
      sessionGrossAmount: z.number(),
      commissionRate: z.number(),
      commissionAmount: z.number(),
    })
  ),
});

export type GetInvoiceParams = z.infer<typeof getInvoiceSchema>['params'];
export type GetInvoiceResponse = z.infer<typeof getInvoiceResponseSchema>;

/**
 * ============================================================================
 * @name    uploadInvoiceSlipSchema
 * @code    me_009_slip_c
 * @desc    Upload invoice payment slip schema
 *
 * ============================================================================
 */
export const uploadInvoiceSlipSchema = z.object({
  params: z.object({
    invoiceId: z.uuidv4('me_009_slip_c_v_01'),
  }),
  body: z.object({
    slipFileId: z.uuidv4('me_009_slip_c_v_02'),
    paymentMethod: z.enum(paymentMethodList, 'me_009_slip_c_v_03').optional(),
  }),
});

export const uploadInvoiceSlipResponseSchema = z.object({
  invoiceId: z.string(),
  status: z.enum(invoiceStatusList),
  slipFileId: z.string(),
  paidAt: z.string(),
});

export type UploadInvoiceSlipParams = z.infer<typeof uploadInvoiceSlipSchema>['params'];
export type UploadInvoiceSlipInput = z.infer<typeof uploadInvoiceSlipSchema>['body'];
export type UploadInvoiceSlipResponse = z.infer<typeof uploadInvoiceSlipResponseSchema>;
