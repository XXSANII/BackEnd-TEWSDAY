import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { Notification } from '@/types/db';
import { UserPayload } from '@/types/express';
import { invoiceStatusType } from '@/constants/billing.constants';
import { bookingStatusType } from '@/constants/marketplace.constants';
import {
  GetBadgeCountsResponse,
  ReadNotificationParams,
  ReadNotificationResponse,
  SearchNotificationInput,
  SearchNotificationResponse,
  searchNotificationValidSortKeys,
} from './notification.validation';

/**
 * ============================================================================
 * @name    me_002_badge
 * @desc    Retrieve unread notification, chat, booking, and invoice badge counts.
 *
 * ============================================================================
 */
export async function getBadgeCounts(user: UserPayload): Promise<GetBadgeCountsResponse> {
  // Build query
  const unreadNotiRow = await db('Notification')
    .where({ userId: user.userId, isReadFlag: false, isActiveFlag: true })
    .count()
    .first<{ count: string }>();

  let unreadMessagesCount = 0;
  if (user.studentProfileId || user.tutorProfileId) {
    const msgQuery = db('Message')
      .join('Conversation', 'Message.conversationId', 'Conversation.conversationId')
      .where({
        'Message.isReadFlag': false,
        'Message.isActiveFlag': true,
        'Conversation.isActiveFlag': true,
      })
      .andWhereNot('Message.senderUserId', user.userId)
      .andWhere((qb) => {
        if (user.studentProfileId) {
          qb.orWhere('Conversation.studentProfileId', user.studentProfileId);
        }
        if (user.tutorProfileId) {
          qb.orWhere('Conversation.tutorProfileId', user.tutorProfileId);
        }
      });
    const unreadMsgRow = await msgQuery.count().first<{ count: string }>();
    unreadMessagesCount = parseInt(unreadMsgRow?.count || '0', 10);
  }

  let pendingBookingsCount = 0;
  if (user.studentProfileId || user.tutorProfileId) {
    const bookingQuery = db('Booking')
      .where({ isActiveFlag: true })
      .whereIn('status', [bookingStatusType.PENDING_CONFIRMATION])
      .andWhere((qb) => {
        if (user.studentProfileId) {
          qb.orWhere('studentProfileId', user.studentProfileId);
        }
        if (user.tutorProfileId) {
          qb.orWhere('tutorProfileId', user.tutorProfileId);
        }
      });
    const pendingBookingRow = await bookingQuery.count().first<{ count: string }>();
    pendingBookingsCount = parseInt(pendingBookingRow?.count || '0', 10);
  }

  const unpaidInvoiceRow = await db('Invoice')
    .where({ payerUserId: user.userId, isActiveFlag: true })
    .whereIn('status', [invoiceStatusType.UNPAID, invoiceStatusType.PENDING_VERIFICATION])
    .count()
    .first<{ count: string }>();

  // Return result
  return {
    unreadNotificationsCount: parseInt(unreadNotiRow?.count || '0', 10),
    unreadMessagesCount,
    pendingBookingsCount,
    unpaidInvoicesCount: parseInt(unpaidInvoiceRow?.count || '0', 10),
  };
}

/**
 * ============================================================================
 * @name    me_002_s
 * @desc    Search notifications of the authenticated user.
 *
 * ============================================================================
 */
export async function searchNotification(
  input: SearchNotificationInput,
  user: UserPayload
): Promise<SearchNotificationResponse> {
  // Build query
  let query = db('Notification')
    .select(
      'notificationId',
      'priorityTier',
      'title',
      'body',
      'referenceType',
      'referenceId',
      'isReadFlag',
      'readAt',
      'createdAt'
    )
    .where({ userId: user.userId, isActiveFlag: true });

  // Apply filters
  if (input.isReadFlag !== undefined) {
    query = query.where({ isReadFlag: input.isReadFlag });
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchNotificationValidSortKeys,
  });

  // Apply pagination
  const totalCountResult = await query.clone().clearSelect().clearOrder().count().first<{ count: string }>();
  const totalCount = parseInt(totalCountResult?.count || '0', 10);
  const pagination = calculatePagination({
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    total: totalCount,
    pageAll: input.pageAll,
  });
  query = applyPagination({
    query,
    pageNumber: pagination.currentPage,
    pageSize: pagination.pageSize,
  });

  // Execute the query
  const notifications: Notification[] = await query;

  // Format return data
  const formattedData = notifications.map((noti) => ({
    notificationId: noti.notificationId,
    priorityTier: noti.priorityTier,
    title: noti.title,
    body: noti.body,
    referenceType: noti.referenceType || null,
    referenceId: noti.referenceId || null,
    isReadFlag: noti.isReadFlag,
    readAt: noti.readAt ? new Date(noti.readAt).toISOString() : null,
    createdAt: new Date(noti.createdAt).toISOString(),
  }));

  // Return result
  const returnResult: SearchNotificationResponse = {
    total: totalCount,
    pagination,
    data: formattedData,
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_002_read
 * @desc    Mark a notification as read.
 *
 * ============================================================================
 */
export async function readNotification(
  params: ReadNotificationParams,
  user: UserPayload
): Promise<ReadNotificationResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingNoti = await trx('Notification')
      .where({
        notificationId: params.id,
        userId: user.userId,
        isActiveFlag: true,
      })
      .first<Notification>();
    if (!existingNoti) {
      throw new ApiError(404, 'me_002_read_s_01', 'Notification not found or inactive.');
    }

    // Prepare data
    const now = new Date();
    const updateData: Partial<Notification> = {
      isReadFlag: true,
      readAt: now,
      ...auditUpdate(user.userLogName),
    };

    // Update data
    const [updatedNoti] = await trx('Notification')
      .where({ notificationId: existingNoti.notificationId })
      .update(updateData)
      .returning<Notification[]>('*');
    if (!updatedNoti) {
      throw new ApiError(500, 'me_002_read_s_02', 'Failed to mark notification as read.');
    }

    // Return result
    return {
      notificationId: updatedNoti.notificationId,
      isReadFlag: updatedNoti.isReadFlag,
      readAt: new Date(updatedNoti.readAt || now).toISOString(),
    };
  });
}
