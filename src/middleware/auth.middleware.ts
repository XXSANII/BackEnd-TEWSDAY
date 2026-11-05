import { JwtTokenPayload } from '@/types/auth';
import { env } from '@/config/env';
import { getAuthRedisKey } from '@/utils/cache/getTemplateRedisKey.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { redis } from '@/utils/redis';
import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { getFile } from '@/utils/storage/getFile.service';

/**
 * ============================================================================
 * @name    authGateMiddleware
 * @code    mid_002
 * @desc
 * - A middleware that allows all requests to pass through.
 * - But if the request have authenticated user, attach user info to `req.user`
 *
 * ============================================================================
 */
export async function authGateMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token;

    // Check if header is valid and have Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token is exits if not, skip to next middleware
    if (!token || token == 'null' || token === undefined) {
      req.user = undefined;
      return next();
    }

    // Check with redis
    const cacheUserKey = getAuthRedisKey(token);
    const cachedUser = (await redis.get(cacheUserKey)) || null;
    if (cachedUser) {
      const parsedUser = JSON.parse(cachedUser);

      // Re-check the status on the cached payload, the cache outlives a status change
      if (parsedUser.status === 'banned') {
        throw new ApiError(403, 'mid_002_05', 'Your account is banned. Please contact support.');
      }

      req.user = parsedUser;
      return next();
    } else {
      req.user = undefined;
    }

    // Check token
    let user = await db('Session')
      .join('User', 'Session.userId', 'User.userId')
      .leftJoin('StudentProfile', function () {
        this.on('StudentProfile.userId', '=', 'User.userId').andOn('StudentProfile.isActiveFlag', '=', db.raw('true'));
      })
      .leftJoin('TutorProfile', function () {
        this.on('TutorProfile.userId', '=', 'User.userId').andOn('TutorProfile.isActiveFlag', '=', db.raw('true'));
      })
      .where({ 'Session.token': token, 'Session.isActiveFlag': true })
      .andWhere('Session.expiredAt', '>', new Date())
      .orderBy('Session.createdAt', 'desc')
      .select(
        'Session.token as token',
        'User.userId as userId',
        'User.username as username',
        'User.displayName as displayName',
        'User.email as email',
        'User.profileImageId as profileImageId',
        'User.coverImageId as coverImageId',
        'User.role as role',
        'User.status as status',
        'User.language as language',
        'User.currentMode as currentMode',
        'StudentProfile.studentProfileId as studentProfileId',
        'TutorProfile.tutorProfileId as tutorProfileId'
      )
      .first();
    if (!user) {
      throw new ApiError(401, 'mid_002_01', 'Authentication failed. Invalid token.');
    }

    // Only `banned` is locked out
    if (user.status === 'banned') {
      throw new ApiError(403, 'mid_002_06', 'Your account is banned. Please contact support.');
    }

    // Decode token and check validity again
    const JWT_SECRET: Secret = env.JWT_SECRET as Secret;
    const decode: JwtTokenPayload = jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
    if (user.userId != decode.userId) {
      throw new ApiError(401, 'mid_002_02', 'Authentication failed. Invalid token.');
    }

    // Pack user full name in `userId [username : displayName]` format
    user.userLogName = `${user.userId} [${user.username} : ${user.displayName}]`;

    // Extract image URLs if profileImageId or coverImageId exists
    if (user.profileImageId) {
      const profileImageUrl = await getFile(user.profileImageId);
      user.profileImageUrl = profileImageUrl.fileUrl;
    }
    if (user.coverImageId) {
      const coverImageUrl = await getFile(user.coverImageId);
      user.coverImageUrl = coverImageUrl.fileUrl;
    }

    // Attach user to req.user and cache to redis
    req.user = user;
    await redis.setex(cacheUserKey, 3600, JSON.stringify(user));

    // Proceed to next middleware
    next();
  } catch (error) {
    req.user = undefined;

    // Handle known JWT errors
    // Pass to next middleware with ApiError
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'mid_002_03', 'Unauthorized: Token expired.'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'mid_002_04', 'Unauthorized: Invalid token.'));
    }

    (error as any).logCode = 'authGateMiddleware';
    next(error);
  }
}

/**
 * ============================================================================
 * @name    authProtectMiddleware
 * @code    mid_003
 * @desc
 * - A middleware that only allows authenticated requests to pass through.
 * - If the request is not authenticated, return 401 error.
 *
 * ============================================================================
 */
export async function authProtectMiddleware(req: Request, res: Response, next: NextFunction) {
  // call gate middleware first and check req.user
  await authGateMiddleware(req, res, (error) => {
    try {
      // If error from gate middleware, pass to next
      if (error) {
        return next(error);
      }

      // If authGateMiddleware finished without an error, check req.user
      if (!req.user) {
        throw new ApiError(401, 'mid_003_01', 'Authentication required. Please sign in first.');
      }

      if (req.user.status === 'banned') {
        throw new ApiError(403, 'mid_003_03', 'Your account is banned. Please contact support.');
      }

      next();
    } catch (error) {
      (error as any).logCode = 'authProtectMiddleware';
      next(error);
    }
  });
}

/**
 * ============================================================================
 * @name    authorizeAdminMiddleware
 * @code    mid_004
 * @desc
 * - A middleware that only allows admin user to pass through.
 * - If the user is not admin, return 403 error.
 *
 * ============================================================================
 */
export async function authorizeAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  // call protect middleware first and check req.user
  await authProtectMiddleware(req, res, (error) => {
    try {
      // If error from protect middleware, pass to next
      if (error) {
        return next(error);
      }

      // If authProtectMiddleware finished without an error, check req.user.role
      if (req.user?.role !== 'admin') {
        throw new ApiError(403, 'mid_004_01', 'Forbidden: You do not have permission to access this resource.');
      }

      next();
    } catch (error) {
      (error as any).logCode = 'authorizeAdminMiddleware';
      next(error);
    }
  });
}

