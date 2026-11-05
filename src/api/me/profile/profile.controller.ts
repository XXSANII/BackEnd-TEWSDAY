import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as profileService from './profile.service';
import {
  editProfileAvatarSchema,
  editProfileModeSchema,
  editProfileNotificationsSchema,
  getProfileSchema,
} from './profile.validation';

/**
 * ============================================================================
 * @name    getProfile
 * @code    me_001_g
 * @route   GET /api/v1/me/profile/get
 * @desc    Get the authenticated user profile and associated mode IDs.
 *
 * ============================================================================
 */
export const getProfileHandler = asyncHandler('me_001_g', async (req) => {
  // Recheck request info
  getProfileSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const profile = await profileService.getProfile(user);

  // Send response
  return { message: 'Profile retrieved successfully.', data: profile };
});

/**
 * ============================================================================
 * @name    editProfileMode
 * @code    me_001_mode
 * @route   PUT /api/v1/me/profile/mode/edit
 * @desc    Switch the active UI mode of the authenticated user.
 *
 * ============================================================================
 */
export const editProfileModeHandler = asyncHandler('me_001_mode', async (req) => {
  // Validate request body
  const { body } = editProfileModeSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedMode = await profileService.editProfileMode(body, user);

  // Send response
  return { message: 'Profile mode edited successfully.', data: updatedMode };
});

/**
 * ============================================================================
 * @name    editProfileAvatar
 * @code    me_001_avatar
 * @route   PUT /api/v1/me/profile/avatar/edit
 * @desc    Update the profile avatar image of the authenticated user.
 *
 * ============================================================================
 */
export const editProfileAvatarHandler = asyncHandler('me_001_avatar', async (req) => {
  // Validate request body
  const { body } = editProfileAvatarSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedAvatar = await profileService.editProfileAvatar(body, user);

  // Send response
  return { message: 'Profile avatar edited successfully.', data: updatedAvatar };
});

/**
 * ============================================================================
 * @name    editProfileNotifications
 * @code    me_001_noti_e
 * @route   PUT /api/v1/me/profile/notifications/edit
 * @desc    Update notification settings for the authenticated user.
 *
 * ============================================================================
 */
export const editProfileNotificationsHandler = asyncHandler('me_001_noti_e', async (req) => {
  // Validate request body
  const { body } = editProfileNotificationsSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedSettings = await profileService.editProfileNotifications(body, user);

  // Send response
  return { message: 'Notification settings edited successfully.', data: updatedSettings };
});
