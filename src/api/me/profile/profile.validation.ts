import z from 'zod';
import { currentModeList, languageList, systemRoleList, userStatusList } from '@/constants/user.constants';

/**
 * ============================================================================
 * @name    getProfileSchema
 * @code    me_001_g
 * @desc    Get current user profile schema
 *
 * ============================================================================
 */
export const getProfileSchema = z.object({
  query: z.object({}).optional(),
});

export const getProfileResponseSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  role: z.enum(systemRoleList),
  status: z.enum(userStatusList),
  language: z.enum(languageList),
  currentMode: z.enum(currentModeList),
  profileImageId: z.string().nullable(),
  coverImageId: z.string().nullable(),
  notificationSettings: z.record(z.string(), z.boolean()),
  studentProfileId: z.string().nullable(),
  tutorProfileId: z.string().nullable(),
});

export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>;

/**
 * ============================================================================
 * @name    editProfileModeSchema
 * @code    me_001_mode
 * @desc    Switch user active mode schema
 *
 * ============================================================================
 */
export const editProfileModeSchema = z.object({
  body: z.object({
    currentMode: z.enum(currentModeList, 'me_001_mode_v_01'),
  }),
});

export const editProfileModeResponseSchema = z.object({
  userId: z.string(),
  currentMode: z.enum(currentModeList),
  studentProfileId: z.string().nullable(),
  tutorProfileId: z.string().nullable(),
});

export type EditProfileModeInput = z.infer<typeof editProfileModeSchema>['body'];
export type EditProfileModeResponse = z.infer<typeof editProfileModeResponseSchema>;

/**
 * ============================================================================
 * @name    editProfileAvatarSchema
 * @code    me_001_avatar
 * @desc    Update user avatar file ID schema
 *
 * ============================================================================
 */
export const editProfileAvatarSchema = z.object({
  body: z.object({
    profileImageId: z.uuidv4('me_001_avatar_v_01'),
  }),
});

export const editProfileAvatarResponseSchema = z.object({
  userId: z.string(),
  profileImageId: z.string().nullable(),
});

export type EditProfileAvatarInput = z.infer<typeof editProfileAvatarSchema>['body'];
export type EditProfileAvatarResponse = z.infer<typeof editProfileAvatarResponseSchema>;

/**
 * ============================================================================
 * @name    editProfileNotificationsSchema
 * @code    me_001_noti_e
 * @desc    Update user notification settings schema
 *
 * ============================================================================
 */
export const editProfileNotificationsSchema = z.object({
  body: z.object({
    emailEnabled: z.boolean('me_001_noti_e_v_01').optional(),
    chatEnabled: z.boolean('me_001_noti_e_v_02').optional(),
    sessionReminders: z.boolean('me_001_noti_e_v_03').optional(),
  }),
});

export const editProfileNotificationsResponseSchema = z.object({
  userId: z.string(),
  notificationSettings: z.record(z.string(), z.boolean()),
});

export type EditProfileNotificationsInput = z.infer<typeof editProfileNotificationsSchema>['body'];
export type EditProfileNotificationsResponse = z.infer<typeof editProfileNotificationsResponseSchema>;
