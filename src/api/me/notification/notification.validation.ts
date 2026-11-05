import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { notificationPriorityList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    getBadgeCountsSchema
 * @code    me_002_badge
 * @desc    Get navbar badge counts schema
 *
 * ============================================================================
 */
export const getBadgeCountsSchema = z.object({
  query: z.object({}).optional(),
});

export const getBadgeCountsResponseSchema = z.object({
  unreadNotificationsCount: z.number(),
  unreadMessagesCount: z.number(),
  pendingBookingsCount: z.number(),
  unpaidInvoicesCount: z.number(),
});

export type GetBadgeCountsResponse = z.infer<typeof getBadgeCountsResponseSchema>;

/**
 * ============================================================================
 * @name    searchNotificationSchema
 * @code    me_002_s
 * @desc    Search notifications schema
 *
 * ============================================================================
 */
export const searchNotificationSortMap = {
  createdAt: 'createdAt',
} as const;
export const searchNotificationValidSortKeys = Object.keys(searchNotificationSortMap) as [string, ...string[]];

export const searchNotificationSchema = z.object({
  body: z.object({
    isReadFlag: z.boolean('me_002_s_v_01').optional(),
    ...paginationSchema.shape,
    ...sortingSchema(searchNotificationValidSortKeys, 'createdAt').shape,
  }),
});

export const searchNotificationResponseSchemaBody = z.object({
  notificationId: z.string(),
  priorityTier: z.enum(notificationPriorityList),
  title: z.string(),
  body: z.string(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  isReadFlag: z.boolean(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export const searchNotificationResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchNotificationResponseSchemaBody),
});

export type SearchNotificationInput = z.infer<typeof searchNotificationSchema>['body'];
export type SearchNotificationResponseBody = z.infer<typeof searchNotificationResponseSchemaBody>;
export type SearchNotificationResponse = z.infer<typeof searchNotificationResponseSchema>;

/**
 * ============================================================================
 * @name    readNotificationSchema
 * @code    me_002_read
 * @desc    Mark notification as read schema
 *
 * ============================================================================
 */
export const readNotificationSchema = z.object({
  params: z.object({
    id: z.uuidv4('me_002_read_v_01'),
  }),
});

export const readNotificationResponseSchema = z.object({
  notificationId: z.string(),
  isReadFlag: z.boolean(),
  readAt: z.string(),
});

export type ReadNotificationParams = z.infer<typeof readNotificationSchema>['params'];
export type ReadNotificationResponse = z.infer<typeof readNotificationResponseSchema>;
