import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as notificationService from './notification.service';
import {
  getBadgeCountsSchema,
  readNotificationSchema,
  searchNotificationSchema,
} from './notification.validation';

/**
 * ============================================================================
 * @name    getBadgeCounts
 * @code    me_002_badge
 * @route   GET /api/v1/me/badge-counts/get
 * @desc    Retrieve unread notification, chat, booking, and invoice badge counts.
 *
 * ============================================================================
 */
export const getBadgeCountsHandler = asyncHandler('me_002_badge', async (req) => {
  // Recheck request info
  getBadgeCountsSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const badgeCounts = await notificationService.getBadgeCounts(user);

  // Send response
  return { message: 'Badge counts retrieved successfully.', data: badgeCounts };
});

/**
 * ============================================================================
 * @name    searchNotification
 * @code    me_002_s
 * @route   POST /api/v1/me/notifications/search
 * @desc    Search notifications of the authenticated user.
 *
 * ============================================================================
 */
export const searchNotificationHandler = asyncHandler('me_002_s', async (req) => {
  // Validate request body
  const { body } = searchNotificationSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const searchResult = await notificationService.searchNotification(body, user);

  // Send response
  return { message: 'Notifications searched successfully.', data: searchResult };
});

/**
 * ============================================================================
 * @name    readNotification
 * @code    me_002_read
 * @route   PUT /api/v1/me/notifications/:id/read
 * @desc    Mark a notification as read.
 *
 * ============================================================================
 */
export const readNotificationHandler = asyncHandler('me_002_read', async (req) => {
  // Recheck request info
  const { params } = readNotificationSchema.parse(req);
  if (!params.id) {
    throw new Error('Notification info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedResult = await notificationService.readNotification(params, user);

  // Send response
  return { message: 'Notification marked as read successfully.', data: updatedResult };
});
