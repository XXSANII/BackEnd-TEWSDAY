// ============================================================================
// User
// ============================================================================

/**
 * @constant  systemRoleType
 * @desc      List of supported system roles in the application.
 */
export const systemRoleType = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
export const systemRoleList = Object.values(systemRoleType);
export type SystemRoleType = (typeof systemRoleList)[number];

/**
 * @constant  currentModeType
 * @desc      UI mode of a signed-in user. A display preference only; it never grants privileges.
 */
export const currentModeType = {
  STUDENT: 'student',
  TUTOR: 'tutor',
} as const;
export const currentModeList = Object.values(currentModeType);
export type CurrentModeType = (typeof currentModeList)[number];

/**
 * @constant  authProviderType
 * @desc      List of supported authentication providers in the application.
 */
export const authProviderType = {
  BASIC: 'basic',
  GOOGLE: 'google',
} as const;
export const authProviderList = Object.values(authProviderType);
export type AuthProviderType = (typeof authProviderList)[number];

// ============================================================================
// User status
// ============================================================================

/**
 * @constant  userStatusType
 * @desc      List of supported user statuses in the application.
 */
export const userStatusType = {
  NORMAL: 'normal',
  REPORTED: 'reported',
  SUSPECTED: 'suspected',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
} as const;
export const userStatusList = Object.values(userStatusType);
export type UserStatusType = (typeof userStatusList)[number];

/**
 * @constant  usableUserStatusList
 * @desc
 * - List of user statuses that are still allowed to sign in and use the API.
 * - Only `banned` is locked out entirely.
 */
export const usableUserStatusList: UserStatusType[] = [
  userStatusType.NORMAL,
  userStatusType.REPORTED,
  userStatusType.SUSPECTED,
  userStatusType.SUSPENDED,
];


// ============================================================================
// Gender
// ============================================================================

/**
 * @constant  genderType
 * @desc      List of supported genders in the application.
 */
export const genderType = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'preferNotToSay',
} as const;
export const genderList = Object.values(genderType);
export type GenderType = (typeof genderList)[number];

// ============================================================================
// Language
// ============================================================================

/**
 * @constant  languageType
 * @desc      List of supported languages in the application.
 */
export const languageType = {
  THAI: 'th',
  ENGLISH: 'en',
} as const;
export const languageList = Object.values(languageType);
export type LanguageType = (typeof languageList)[number];
