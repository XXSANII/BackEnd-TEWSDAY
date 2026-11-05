import crypto from 'crypto';
import { appConfig } from '@/config/app.config';
import { getAuthRedisKey } from '@/utils/cache/getTemplateRedisKey.helper';
import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditCreate, auditSoftDelete, auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { redis } from '@/utils/redis';
import { AuthAccount, Session, StudentProfile, TutorProfile, User, UserActivityLog } from '@/types/db';
import { UserPayload } from '@/types/express';
import { authProviderType, currentModeType, languageType, systemRoleType, userStatusType } from '@/constants/user.constants';
import { teachingLocationType, verificationStatusType } from '@/constants/marketplace.constants';
import {
  comparePassword,
  establishUserSession,
  hashPassword,
  RequestClientMeta,
  sanitizeIpAddress,
  signSessionToken,
} from './_auth.utils';
import {
  DeleteSessionParams,
  DeleteSessionResponse,
  LoginInput,
  LoginResponse,
  LogoutResponse,
  OauthLoginInput,
  OauthLoginParams,
  OauthLoginResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
  RegisterInput,
  RegisterResponse,
  SearchSessionInput,
  SearchSessionResponse,
  searchSessionValidSortKeys,
} from './auth.validation';

/**
 * ============================================================================
 * @name    auth_001_c
 * @desc    Register a new user account and establish a session.
 *
 * ============================================================================
 */
export async function register(input: RegisterInput, headers: RequestClientMeta): Promise<RegisterResponse> {
  return db.transaction(async (trx) => {
    // Prepare data
    const normalizedEmail = input.email.trim().toLowerCase();
    const rawEmailPrefix = (normalizedEmail.split('@')[0] || 'user').replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';
    const candidateUsername =
      input.username?.trim().toLowerCase() || `${rawEmailPrefix}_${crypto.randomBytes(3).toString('hex')}`;
    const displayName = input.displayName?.trim() || candidateUsername;
    const currentMode = input.currentMode || currentModeType.STUDENT;

    // Check existing user
    const existingEmailUser = await trx('User')
      .whereRaw('lower("email") = ?', [normalizedEmail])
      .andWhere({ isActiveFlag: true })
      .first<User>();
    if (existingEmailUser) {
      throw new ApiError(409, 'auth_001_c_s_01', 'Email is already registered.');
    }

    const existingUsernameUser = await trx('User')
      .whereRaw('lower("username") = ?', [candidateUsername])
      .andWhere({ isActiveFlag: true })
      .first<User>();
    if (existingUsernameUser) {
      throw new ApiError(409, 'auth_001_c_s_02', 'Username is already taken.');
    }

    // -----------------------------------
    // Insert data
    // -----------------------------------
    const passwordHash = await hashPassword(input.password);
    const newUserId = crypto.randomUUID();
    const userLogName = `${newUserId} [${candidateUsername} : ${displayName}]`;

    const newUserData: Partial<User> = {
      userId: newUserId,
      username: candidateUsername,
      displayName,
      email: normalizedEmail,
      phoneNumber: input.phoneNumber || null,
      role: systemRoleType.USER,
      status: userStatusType.NORMAL,
      language: languageType.THAI,
      currentMode,
      consentAcceptedAt: new Date(),
      ...auditCreate(userLogName),
    };

    const [createdUser] = await trx('User').insert(newUserData).returning<User[]>('*');
    if (!createdUser) {
      throw new ApiError(500, 'auth_001_c_s_03', 'Failed to create user account.');
    }

    const newAuthAccountData: Partial<AuthAccount> = {
      userId: createdUser.userId,
      provider: authProviderType.BASIC,
      passwordHash,
      ...auditCreate(userLogName),
    };
    const [createdAuthAccount] = await trx('AuthAccount').insert(newAuthAccountData).returning<AuthAccount[]>('*');
    if (!createdAuthAccount) {
      throw new ApiError(500, 'auth_001_c_s_04', 'Failed to create authentication credentials.');
    }

    const newStudentProfileData: Partial<StudentProfile> = {
      userId: createdUser.userId,
      ...auditCreate(userLogName),
    };
    const [createdStudentProfile] = await trx('StudentProfile').insert(newStudentProfileData).returning<StudentProfile[]>('*');
    if (!createdStudentProfile) {
      throw new ApiError(500, 'auth_001_c_s_05', 'Failed to create student profile.');
    }

    if (currentMode === currentModeType.TUTOR) {
      const newTutorProfileData: Partial<TutorProfile> = {
        userId: createdUser.userId,
        teachingLocationType: teachingLocationType.ONLINE,
        verificationStatus: verificationStatusType.UNVERIFIED,
        popularityScore: 0,
        ...auditCreate(userLogName),
      };
      const [createdTutorProfile] = await trx('TutorProfile').insert(newTutorProfileData).returning<TutorProfile[]>('*');
      if (!createdTutorProfile) {
        throw new ApiError(500, 'auth_001_c_s_06', 'Failed to create tutor profile.');
      }
    }

    const sessionResult = await establishUserSession(
      {
        userId: createdUser.userId,
        userLogName,
        meta: {
          ipAddress: headers.ipAddress,
          userAgent: headers.userAgent,
          deviceId: input.deviceId || headers.deviceId,
        },
        errorCode: 'auth_001_c_s_07',
      },
      trx
    );

    const activityLogData: Partial<UserActivityLog> = {
      userId: createdUser.userId,
      actionType: 'create',
      entityType: 'User',
      entityId: createdUser.userId,
      ipAddress: sanitizeIpAddress(headers.ipAddress),
      userAgent: headers.userAgent || null,
      metadata: { provider: authProviderType.BASIC, currentMode },
      ...auditCreate(userLogName),
    };
    await trx('UserActivityLog').insert(activityLogData);

    // Return result
    return {
      userId: createdUser.userId,
      sessionId: sessionResult.sessionId,
      token: sessionResult.token,
      expiredAt: sessionResult.expiredAt,
      currentMode: createdUser.currentMode,
    };
  });
}

/**
 * ============================================================================
 * @name    auth_002_c
 * @desc    Authenticate a user with email and password and establish a session.
 *
 * ============================================================================
 */
export async function login(input: LoginInput, headers: RequestClientMeta): Promise<LoginResponse> {
  return db.transaction(async (trx) => {
    // Prepare data
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check existing user
    const existingUser = await trx('User')
      .whereRaw('lower("email") = ?', [normalizedEmail])
      .andWhere({ isActiveFlag: true })
      .first<User>();
    if (!existingUser) {
      throw new ApiError(401, 'auth_002_c_s_01', 'Invalid email or password.');
    }

    if (existingUser.status === userStatusType.BANNED) {
      throw new ApiError(403, 'auth_002_c_s_02', 'Your account is banned. Please contact support.');
    }

    const existingAuthAccount = await trx('AuthAccount')
      .where({
        userId: existingUser.userId,
        provider: authProviderType.BASIC,
        isActiveFlag: true,
      })
      .first<AuthAccount>();
    if (!existingAuthAccount || !existingAuthAccount.passwordHash) {
      throw new ApiError(401, 'auth_002_c_s_01', 'Invalid email or password.');
    }

    const isPasswordValid = await comparePassword(input.password, existingAuthAccount.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'auth_002_c_s_01', 'Invalid email or password.');
    }

    // -----------------------------------
    // Insert data
    // -----------------------------------
    const userLogName = `${existingUser.userId} [${existingUser.username} : ${existingUser.displayName}]`;
    const sessionResult = await establishUserSession(
      {
        userId: existingUser.userId,
        userLogName,
        meta: {
          ipAddress: headers.ipAddress,
          userAgent: headers.userAgent,
          deviceId: input.deviceId || headers.deviceId,
        },
        errorCode: 'auth_002_c_s_03',
      },
      trx
    );

    const activityLogData: Partial<UserActivityLog> = {
      userId: existingUser.userId,
      actionType: 'create',
      entityType: 'Session',
      entityId: sessionResult.sessionId,
      ipAddress: sanitizeIpAddress(headers.ipAddress),
      userAgent: headers.userAgent || null,
      metadata: { provider: authProviderType.BASIC },
      ...auditCreate(userLogName),
    };
    await trx('UserActivityLog').insert(activityLogData);

    // Return result
    return {
      userId: existingUser.userId,
      sessionId: sessionResult.sessionId,
      token: sessionResult.token,
      expiredAt: sessionResult.expiredAt,
      currentMode: existingUser.currentMode,
    };
  });
}

/**
 * ============================================================================
 * @name    auth_003_c
 * @desc    Authenticate or register a user via OAuth provider and establish a session.
 *
 * ============================================================================
 */
export async function oauthLogin(
  params: OauthLoginParams,
  input: OauthLoginInput,
  headers: RequestClientMeta
): Promise<OauthLoginResponse> {
  return db.transaction(async (trx) => {
    // Prepare data
    const { provider } = params;
    const normalizedEmail = input.email.trim().toLowerCase();
    let isNewUserFlag = false;

    // Check existing data
    let existingAuthAccount = await trx('AuthAccount')
      .where({
        provider,
        providerAccountId: input.providerAccountId,
        isActiveFlag: true,
      })
      .first<AuthAccount>();

    let targetUser: User | undefined;

    if (existingAuthAccount) {
      targetUser = await trx('User')
        .where({ userId: existingAuthAccount.userId, isActiveFlag: true })
        .first<User>();
    } else {
      targetUser = await trx('User')
        .whereRaw('lower("email") = ?', [normalizedEmail])
        .andWhere({ isActiveFlag: true })
        .first<User>();
    }

    // -----------------------------------
    // Insert data
    // -----------------------------------
    if (!targetUser) {
      isNewUserFlag = true;
      const newUserId = crypto.randomUUID();
      const rawPrefix = (normalizedEmail.split('@')[0] || 'user').replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';
      const candidateUsername = `${rawPrefix}_${crypto.randomBytes(3).toString('hex')}`;
      const displayName = input.displayName?.trim() || candidateUsername;
      const currentMode = input.currentMode || currentModeType.STUDENT;
      const userLogName = `${newUserId} [${candidateUsername} : ${displayName}]`;

      const newUserData: Partial<User> = {
        userId: newUserId,
        username: candidateUsername,
        displayName,
        email: normalizedEmail,
        emailVerifiedAt: new Date(),
        role: systemRoleType.USER,
        status: userStatusType.NORMAL,
        language: languageType.THAI,
        currentMode,
        consentAcceptedAt: new Date(),
        ...auditCreate(userLogName),
      };
      const [createdUser] = await trx('User').insert(newUserData).returning<User[]>('*');
      if (!createdUser) {
        throw new ApiError(500, 'auth_003_c_s_01', 'Failed to create OAuth user account.');
      }
      targetUser = createdUser;

      const newStudentProfileData: Partial<StudentProfile> = {
        userId: targetUser.userId,
        ...auditCreate(userLogName),
      };
      await trx('StudentProfile').insert(newStudentProfileData);

      if (currentMode === currentModeType.TUTOR) {
        const newTutorProfileData: Partial<TutorProfile> = {
          userId: targetUser.userId,
          teachingLocationType: teachingLocationType.ONLINE,
          verificationStatus: verificationStatusType.UNVERIFIED,
          popularityScore: 0,
          ...auditCreate(userLogName),
        };
        await trx('TutorProfile').insert(newTutorProfileData);
      }
    }

    if (targetUser.status === userStatusType.BANNED) {
      throw new ApiError(403, 'auth_003_c_s_02', 'Your account is banned. Please contact support.');
    }

    const userLogName = `${targetUser.userId} [${targetUser.username} : ${targetUser.displayName}]`;

    if (!existingAuthAccount) {
      const newAuthData: Partial<AuthAccount> = {
        userId: targetUser.userId,
        provider,
        providerAccountId: input.providerAccountId,
        ...auditCreate(userLogName),
      };
      const [createdAuth] = await trx('AuthAccount').insert(newAuthData).returning<AuthAccount[]>('*');
      if (!createdAuth) {
        throw new ApiError(500, 'auth_003_c_s_03', 'Failed to link OAuth provider account.');
      }
    }

    const sessionResult = await establishUserSession(
      {
        userId: targetUser.userId,
        userLogName,
        meta: {
          ipAddress: headers.ipAddress,
          userAgent: headers.userAgent,
          deviceId: input.deviceId || headers.deviceId,
        },
        errorCode: 'auth_003_c_s_04',
      },
      trx
    );

    // Return result
    return {
      userId: targetUser.userId,
      sessionId: sessionResult.sessionId,
      token: sessionResult.token,
      expiredAt: sessionResult.expiredAt,
      currentMode: targetUser.currentMode,
      isNewUserFlag,
    };
  });
}

/**
 * ============================================================================
 * @name    auth_004_c
 * @desc    Rotate an active session token and extend its expiration timestamp.
 *
 * ============================================================================
 */
export async function refreshToken(input: RefreshTokenInput, headers: RequestClientMeta): Promise<RefreshTokenResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingSession = await trx('Session')
      .where({ token: input.token, isActiveFlag: true })
      .andWhere('expiredAt', '>', new Date())
      .first<Session>();
    if (!existingSession) {
      throw new ApiError(401, 'auth_004_c_s_01', 'Session not found or expired.');
    }

    const existingUser = await trx('User')
      .where({ userId: existingSession.userId, isActiveFlag: true })
      .first<User>();
    if (!existingUser) {
      throw new ApiError(401, 'auth_004_c_s_02', 'User account not found or inactive.');
    }

    if (existingUser.status === userStatusType.BANNED) {
      throw new ApiError(403, 'auth_004_c_s_03', 'Your account is banned. Please contact support.');
    }

    // Prepare data
    const userLogName = `${existingUser.userId} [${existingUser.username} : ${existingUser.displayName}]`;
    const newToken = signSessionToken({
      userId: existingUser.userId,
      sessionId: existingSession.sessionId,
    });
    const newExpiredAt = new Date(Date.now() + appConfig.auth.SESSION_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

    // Update data
    const updateSessionData: Partial<Session> = {
      token: newToken,
      expiredAt: newExpiredAt,
      ipAddress: sanitizeIpAddress(headers.ipAddress) ?? existingSession.ipAddress,
      userAgent: headers.userAgent ?? existingSession.userAgent,
      deviceId: input.deviceId ?? existingSession.deviceId,
      ...auditUpdate(userLogName),
    };

    const [updatedSession] = await trx('Session')
      .where({ sessionId: existingSession.sessionId })
      .update(updateSessionData)
      .returning<Session[]>('*');
    if (!updatedSession) {
      throw new ApiError(500, 'auth_004_c_s_04', 'Failed to refresh session token.');
    }

    // Invalidate cache
    await redis.del(getAuthRedisKey(input.token));

    // Return result
    return {
      userId: existingUser.userId,
      sessionId: updatedSession.sessionId,
      token: updatedSession.token,
      expiredAt: new Date(updatedSession.expiredAt).toISOString(),
    };
  });
}

/**
 * ============================================================================
 * @name    auth_005_c
 * @desc    Sign out the current user session and revoke its token.
 *
 * ============================================================================
 */
export async function logout(user: UserPayload): Promise<LogoutResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingSession = await trx('Session')
      .where({
        token: user.token,
        userId: user.userId,
        isActiveFlag: true,
      })
      .first<Session>();
    if (!existingSession) {
      throw new ApiError(404, 'auth_005_c_s_01', 'Active session not found.');
    }

    // -----------------------------------
    // Delete main record
    // -----------------------------------
    const updateDeleteData: Partial<Session> = auditSoftDelete(user.userLogName);
    const [deletedSession] = await trx('Session')
      .where({ sessionId: existingSession.sessionId })
      .update(updateDeleteData)
      .returning<Session[]>('*');
    if (!deletedSession) {
      throw new ApiError(500, 'auth_005_c_s_02', 'Failed to revoke session.');
    }

    // Invalidate cache
    await redis.del(getAuthRedisKey(user.token));

    // Return result
    return {
      sessionId: deletedSession.sessionId,
    };
  });
}

/**
 * ============================================================================
 * @name    auth_006_s
 * @desc    Search active sessions of the authenticated user.
 *
 * ============================================================================
 */
export async function searchSession(input: SearchSessionInput, user: UserPayload): Promise<SearchSessionResponse> {
  // Build query
  let query = db('Session')
    .select('sessionId', 'token', 'ipAddress', 'userAgent', 'deviceId', 'expiredAt', 'createdAt')
    .where({
      userId: user.userId,
      isActiveFlag: true,
    })
    .andWhere('expiredAt', '>', new Date());

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchSessionValidSortKeys,
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
  const sessions: Session[] = await query;

  // Format return data
  const formattedSessions = sessions.map((session) => ({
    sessionId: session.sessionId,
    ipAddress: session.ipAddress ? String(session.ipAddress) : null,
    userAgent: session.userAgent || null,
    deviceId: session.deviceId || null,
    expiredAt: new Date(session.expiredAt).toISOString(),
    createdAt: new Date(session.createdAt).toISOString(),
    isCurrentSessionFlag: session.token === user.token,
  }));

  // Return result
  const returnResult: SearchSessionResponse = {
    total: totalCount,
    pagination,
    data: formattedSessions,
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    auth_006_d
 * @desc    Revoke a specific active session belonging to the authenticated user.
 *
 * ============================================================================
 */
export async function deleteSession(params: DeleteSessionParams, user: UserPayload): Promise<DeleteSessionResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingSession = await trx('Session')
      .where({
        sessionId: params.sessionId,
        userId: user.userId,
        isActiveFlag: true,
      })
      .first<Session>();
    if (!existingSession) {
      throw new ApiError(404, 'auth_006_d_s_01', 'Session not found or inactive.');
    }

    // -----------------------------------
    // Delete main record
    // -----------------------------------
    const updateDeleteData: Partial<Session> = auditSoftDelete(user.userLogName);
    const [deletedSession] = await trx('Session')
      .where({ sessionId: existingSession.sessionId })
      .update(updateDeleteData)
      .returning<Session[]>('*');
    if (!deletedSession) {
      throw new ApiError(500, 'auth_006_d_s_02', 'Failed to revoke session.');
    }

    // Invalidate cache
    await redis.del(getAuthRedisKey(existingSession.token));

    // Return result
    return {
      sessionId: deletedSession.sessionId,
    };
  });
}
