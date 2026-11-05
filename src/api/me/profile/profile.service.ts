import { getAuthRedisKey } from '@/utils/cache/getTemplateRedisKey.helper';
import { auditCreate, auditUpdate } from '@/utils/data/auditFields.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { redis } from '@/utils/redis';
import { File, StudentProfile, TutorProfile, User } from '@/types/db';
import { UserPayload } from '@/types/express';
import { teachingLocationType, verificationStatusType } from '@/constants/marketplace.constants';
import { currentModeType } from '@/constants/user.constants';
import {
  EditProfileAvatarInput,
  EditProfileAvatarResponse,
  EditProfileModeInput,
  EditProfileModeResponse,
  EditProfileNotificationsInput,
  EditProfileNotificationsResponse,
  GetProfileResponse,
} from './profile.validation';

/**
 * ============================================================================
 * @name    me_001_g
 * @desc    Get the authenticated user profile and associated mode IDs.
 *
 * ============================================================================
 */
export async function getProfile(user: UserPayload): Promise<GetProfileResponse> {
  // Check existing data
  const existingUser = await db('User').where({ userId: user.userId, isActiveFlag: true }).first<User>();
  if (!existingUser) {
    throw new ApiError(404, 'me_001_g_s_01', 'User account not found or inactive.');
  }

  const studentProfile = await db('StudentProfile')
    .where({ userId: user.userId, isActiveFlag: true })
    .first<StudentProfile>();
  const tutorProfile = await db('TutorProfile')
    .where({ userId: user.userId, isActiveFlag: true })
    .first<TutorProfile>();

  // Return result
  return {
    userId: existingUser.userId,
    username: existingUser.username,
    displayName: existingUser.displayName,
    email: existingUser.email,
    phoneNumber: existingUser.phoneNumber || null,
    role: existingUser.role,
    status: existingUser.status,
    language: existingUser.language,
    currentMode: existingUser.currentMode,
    profileImageId: existingUser.profileImageId || null,
    coverImageId: existingUser.coverImageId || null,
    notificationSettings: existingUser.notificationSettings || {
      emailEnabled: true,
      chatEnabled: true,
      sessionReminders: true,
    },
    studentProfileId: studentProfile?.studentProfileId || null,
    tutorProfileId: tutorProfile?.tutorProfileId || null,
  };
}

/**
 * ============================================================================
 * @name    me_001_mode
 * @desc    Switch the active UI mode of the authenticated user.
 *
 * ============================================================================
 */
export async function editProfileMode(
  input: EditProfileModeInput,
  user: UserPayload
): Promise<EditProfileModeResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingUser = await trx('User').where({ userId: user.userId, isActiveFlag: true }).first<User>();
    if (!existingUser) {
      throw new ApiError(404, 'me_001_mode_s_01', 'User account not found or inactive.');
    }

    let studentProfile = await trx('StudentProfile')
      .where({ userId: user.userId, isActiveFlag: true })
      .first<StudentProfile>();
    if (!studentProfile) {
      const [createdStudent] = await trx('StudentProfile')
        .insert({
          userId: user.userId,
          ...auditCreate(user.userLogName),
        })
        .returning<StudentProfile[]>('*');
      studentProfile = createdStudent;
    }

    let tutorProfile = await trx('TutorProfile')
      .where({ userId: user.userId, isActiveFlag: true })
      .first<TutorProfile>();
    if (input.currentMode === currentModeType.TUTOR && !tutorProfile) {
      const [createdTutor] = await trx('TutorProfile')
        .insert({
          userId: user.userId,
          teachingLocationType: teachingLocationType.ONLINE,
          verificationStatus: verificationStatusType.UNVERIFIED,
          popularityScore: 0,
          ...auditCreate(user.userLogName),
        })
        .returning<TutorProfile[]>('*');
      tutorProfile = createdTutor;
    }

    // Update data
    const updateData: Partial<User> = {
      currentMode: input.currentMode,
      ...auditUpdate(user.userLogName),
    };
    const [updatedUser] = await trx('User')
      .where({ userId: user.userId })
      .update(updateData)
      .returning<User[]>('*');
    if (!updatedUser) {
      throw new ApiError(500, 'me_001_mode_s_02', 'Failed to switch user mode.');
    }

    // Invalidate cache
    await redis.del(getAuthRedisKey(user.token));

    // Return result
    return {
      userId: updatedUser.userId,
      currentMode: updatedUser.currentMode,
      studentProfileId: studentProfile?.studentProfileId || null,
      tutorProfileId: tutorProfile?.tutorProfileId || null,
    };
  });
}

/**
 * ============================================================================
 * @name    me_001_avatar
 * @desc    Update the profile avatar image of the authenticated user.
 *
 * ============================================================================
 */
export async function editProfileAvatar(
  input: EditProfileAvatarInput,
  user: UserPayload
): Promise<EditProfileAvatarResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingUser = await trx('User').where({ userId: user.userId, isActiveFlag: true }).first<User>();
    if (!existingUser) {
      throw new ApiError(404, 'me_001_avatar_s_01', 'User account not found or inactive.');
    }

    const existingFile = await trx('File')
      .where({ fileId: input.profileImageId, isActiveFlag: true })
      .first<File>();
    if (!existingFile) {
      throw new ApiError(404, 'me_001_avatar_s_02', 'Avatar file not found or inactive.');
    }

    // Update data
    const updateData: Partial<User> = {
      profileImageId: input.profileImageId,
      ...auditUpdate(user.userLogName),
    };
    const [updatedUser] = await trx('User')
      .where({ userId: user.userId })
      .update(updateData)
      .returning<User[]>('*');
    if (!updatedUser) {
      throw new ApiError(500, 'me_001_avatar_s_03', 'Failed to update profile avatar.');
    }

    // Invalidate cache
    await redis.del(getAuthRedisKey(user.token));

    // Return result
    return {
      userId: updatedUser.userId,
      profileImageId: updatedUser.profileImageId || null,
    };
  });
}

/**
 * ============================================================================
 * @name    me_001_noti_e
 * @desc    Update notification settings for the authenticated user.
 *
 * ============================================================================
 */
export async function editProfileNotifications(
  input: EditProfileNotificationsInput,
  user: UserPayload
): Promise<EditProfileNotificationsResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingUser = await trx('User').where({ userId: user.userId, isActiveFlag: true }).first<User>();
    if (!existingUser) {
      throw new ApiError(404, 'me_001_noti_e_s_01', 'User account not found or inactive.');
    }

    // Prepare data
    const currentSettings = existingUser.notificationSettings || {
      emailEnabled: true,
      chatEnabled: true,
      sessionReminders: true,
    };
    const mergedSettings: Record<string, boolean> = {
      ...currentSettings,
      ...(input.emailEnabled !== undefined ? { emailEnabled: input.emailEnabled } : {}),
      ...(input.chatEnabled !== undefined ? { chatEnabled: input.chatEnabled } : {}),
      ...(input.sessionReminders !== undefined ? { sessionReminders: input.sessionReminders } : {}),
    };

    // Update data
    const updateData: Partial<User> = {
      notificationSettings: mergedSettings,
      ...auditUpdate(user.userLogName),
    };
    const [updatedUser] = await trx('User')
      .where({ userId: user.userId })
      .update(updateData)
      .returning<User[]>('*');
    if (!updatedUser) {
      throw new ApiError(500, 'me_001_noti_e_s_02', 'Failed to update notification settings.');
    }

    // Invalidate cache
    await redis.del(getAuthRedisKey(user.token));

    // Return result
    return {
      userId: updatedUser.userId,
      notificationSettings: updatedUser.notificationSettings,
    };
  });
}
