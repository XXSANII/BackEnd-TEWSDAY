import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { emailRegEx, telRegEx, usernameRegEx } from '@/utils/validation/regex';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { authProviderList, currentModeList } from '@/constants/user.constants';

/**
 * ============================================================================
 * @name    registerSchema
 * @code    auth_001_c
 * @desc    Register user schema
 *
 * ============================================================================
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.string('auth_001_c_v_01').regex(emailRegEx, 'auth_001_c_v_02'),
    password: z.string('auth_001_c_v_03').min(8, 'auth_001_c_v_04'),
    displayName: z.string('auth_001_c_v_05').min(1, 'auth_001_c_v_06').max(150, 'auth_001_c_v_06').optional(),
    username: z.string('auth_001_c_v_07').regex(usernameRegEx, 'auth_001_c_v_08').optional(),
    phoneNumber: z.string('auth_001_c_v_09').regex(telRegEx, 'auth_001_c_v_10').optional().nullable(),
    currentMode: z.enum(currentModeList, 'auth_001_c_v_11').optional(),
    deviceId: z.string('auth_001_c_v_12').max(100, 'auth_001_c_v_12').optional().nullable(),
  }),
});

export const registerResponseSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  token: z.string(),
  expiredAt: z.string(),
  currentMode: z.enum(currentModeList),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

/**
 * ============================================================================
 * @name    loginSchema
 * @code    auth_002_c
 * @desc    Login user schema
 *
 * ============================================================================
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string('auth_002_c_v_01').regex(emailRegEx, 'auth_002_c_v_02'),
    password: z.string('auth_002_c_v_03').min(1, 'auth_002_c_v_04'),
    deviceId: z.string('auth_002_c_v_05').max(100, 'auth_002_c_v_05').optional().nullable(),
  }),
});

export const loginResponseSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  token: z.string(),
  expiredAt: z.string(),
  currentMode: z.enum(currentModeList),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * ============================================================================
 * @name    oauthLoginSchema
 * @code    auth_003_c
 * @desc    OAuth login schema
 *
 * ============================================================================
 */
export const oauthLoginSchema = z.object({
  params: z.object({
    provider: z.enum(authProviderList, 'auth_003_c_v_01'),
  }),
  body: z.object({
    idToken: z.string('auth_003_c_v_09').min(1, 'auth_003_c_v_09'),
    providerAccountId: z.string('auth_003_c_v_02').min(1, 'auth_003_c_v_03').optional(),
    email: z.string('auth_003_c_v_04').regex(emailRegEx, 'auth_003_c_v_05').optional(),
    displayName: z.string('auth_003_c_v_06').min(1, 'auth_003_c_v_06').max(150, 'auth_003_c_v_06').optional(),
    currentMode: z.enum(currentModeList, 'auth_003_c_v_07').optional(),
    deviceId: z.string('auth_003_c_v_08').max(100, 'auth_003_c_v_08').optional().nullable(),
  }),
});

export const oauthLoginResponseSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  token: z.string(),
  expiredAt: z.string(),
  currentMode: z.enum(currentModeList),
  isNewUserFlag: z.boolean(),
});

export type OauthLoginParams = z.infer<typeof oauthLoginSchema>['params'];
export type OauthLoginInput = z.infer<typeof oauthLoginSchema>['body'];
export type OauthLoginResponse = z.infer<typeof oauthLoginResponseSchema>;

/**
 * ============================================================================
 * @name    refreshTokenSchema
 * @code    auth_004_c
 * @desc    Refresh session token schema
 *
 * ============================================================================
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    token: z.string('auth_004_c_v_01').min(1, 'auth_004_c_v_02'),
    deviceId: z.string('auth_004_c_v_03').max(100, 'auth_004_c_v_03').optional().nullable(),
  }),
});

export const refreshTokenResponseSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  token: z.string(),
  expiredAt: z.string(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

/**
 * ============================================================================
 * @name    logoutSchema
 * @code    auth_005_c
 * @desc    Logout session schema
 *
 * ============================================================================
 */
export const logoutSchema = z.object({
  body: z.object({}).optional(),
});

export const logoutResponseSchema = z.object({
  sessionId: z.string(),
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

/**
 * ============================================================================
 * @name    searchSessionSchema
 * @code    auth_006_s
 * @desc    Search user sessions schema
 *
 * ============================================================================
 */
export const searchSessionSortMap = {
  createdAt: 'createdAt',
  expiredAt: 'expiredAt',
} as const;
export const searchSessionValidSortKeys = Object.keys(searchSessionSortMap) as [string, ...string[]];

export const searchSessionSchema = z.object({
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchSessionValidSortKeys, 'createdAt').shape,
  }),
});

export const searchSessionResponseSchemaBody = z.object({
  sessionId: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  deviceId: z.string().nullable(),
  expiredAt: z.string(),
  createdAt: z.string(),
  isCurrentSessionFlag: z.boolean(),
});

export const searchSessionResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchSessionResponseSchemaBody),
});

export type SearchSessionInput = z.infer<typeof searchSessionSchema>['body'];
export type SearchSessionResponseBody = z.infer<typeof searchSessionResponseSchemaBody>;
export type SearchSessionResponse = z.infer<typeof searchSessionResponseSchema>;

/**
 * ============================================================================
 * @name    deleteSessionSchema
 * @code    auth_006_d
 * @desc    Delete user session schema
 *
 * ============================================================================
 */
export const deleteSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuidv4('auth_006_d_v_01'),
  }),
});

export const deleteSessionResponseSchema = z.object({
  sessionId: z.string(),
});

export type DeleteSessionParams = z.infer<typeof deleteSessionSchema>['params'];
export type DeleteSessionResponse = z.infer<typeof deleteSessionResponseSchema>;
