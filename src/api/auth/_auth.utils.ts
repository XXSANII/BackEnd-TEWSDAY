import crypto from 'crypto';
import net from 'net';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Knex } from 'knex';
import { appConfig } from '@/config/app.config';
import { env } from '@/config/env';
import { auditCreate } from '@/utils/data/auditFields.helper';
import { ApiError } from '@/utils/error/ApiError';
import { JwtTokenPayload } from '@/types/auth';
import { Session } from '@/types/db';

export interface RequestClientMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}

export interface EstablishedSessionResult {
  sessionId: string;
  token: string;
  expiredAt: string;
}

/**
 * ============================================================================
 * @name    hashPassword
 * @desc    Hash a plain-text password using bcrypt.
 *
 * ============================================================================
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * ============================================================================
 * @name    comparePassword
 * @desc    Compare a plain-text password against a bcrypt password hash.
 *
 * ============================================================================
 */
export async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * ============================================================================
 * @name    sanitizeIpAddress
 * @desc    Normalize and validate an IP address string for PostgreSQL inet column.
 *
 * ============================================================================
 */
export function sanitizeIpAddress(rawIp?: string | null): string | null {
  if (!rawIp) {
    return null;
  }
  const firstForwarded = rawIp.split(',')[0]?.trim() || '';
  const cleaned = firstForwarded.replace(/^::ffff:/, '');
  if (net.isIP(cleaned) !== 0) {
    return cleaned;
  }
  if (net.isIP(firstForwarded) !== 0) {
    return firstForwarded;
  }
  return null;
}

/**
 * ============================================================================
 * @name    signSessionToken
 * @desc    Sign a JWT token containing userId and sessionId.
 *
 * ============================================================================
 */
export function signSessionToken(payload: JwtTokenPayload): string {
  const secret: Secret = (env.JWT_SECRET || 'dev-jwt-secret') as Secret;
  const options: SignOptions = {
    expiresIn: appConfig.auth.JWT_EXPIRE as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, secret, options);
}

/**
 * ============================================================================
 * @name    establishUserSession
 * @desc    Create a new Session record and sign a corresponding JWT token.
 *
 * ============================================================================
 */
export async function establishUserSession(
  params: {
    userId: string;
    userLogName: string;
    meta?: RequestClientMeta;
    errorCode: string;
  },
  trx: Knex | Knex.Transaction
): Promise<EstablishedSessionResult> {
  const { userId, userLogName, meta, errorCode } = params;
  const sessionId = crypto.randomUUID();
  const token = signSessionToken({ userId, sessionId });
  const expiredAtDate = new Date(Date.now() + appConfig.auth.SESSION_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

  const newSessionData: Partial<Session> = {
    sessionId,
    userId,
    token,
    expiredAt: expiredAtDate,
    ipAddress: sanitizeIpAddress(meta?.ipAddress),
    userAgent: meta?.userAgent || null,
    deviceId: meta?.deviceId || null,
    ...auditCreate(userLogName),
  };

  const [createdSession] = await trx('Session').insert(newSessionData).returning<Session[]>('*');
  if (!createdSession) {
    throw new ApiError(500, errorCode, 'Failed to establish user session.');
  }

  return {
    sessionId: createdSession.sessionId,
    token: createdSession.token,
    expiredAt: new Date(createdSession.expiredAt).toISOString(),
  };
}

export interface GoogleIdentity {
  providerAccountId: string;
  email: string;
  displayName?: string;
}

/**
 * ============================================================================
 * @name    verifyGoogleIdToken
 * @desc
 * - Verify a Google ID token with Google's tokeninfo endpoint and return the identity it proves.
 * - Rejects the token unless the audience is our `GOOGLE_CLIENT_ID`, the issuer is Google, it has not expired and the
 *   email is verified.
 * - The identity comes only from the verified token, never from client-supplied fields.
 *
 * ============================================================================
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, 'auth_003_c_s_06', 'Google sign-in is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new ApiError(502, 'auth_003_c_s_08', 'Unable to verify the Google ID token.');
  }
  if (!response.ok) {
    throw new ApiError(401, 'auth_003_c_s_07', 'Invalid Google ID token.');
  }

  const claims = (await response.json()) as Record<string, string | undefined>;
  const isGoogleIssuer = claims.iss === 'accounts.google.com' || claims.iss === 'https://accounts.google.com';
  const isNotExpired = Number(claims.exp) * 1000 > Date.now();
  if (
    claims.aud !== env.GOOGLE_CLIENT_ID ||
    !isGoogleIssuer ||
    !isNotExpired ||
    !claims.sub ||
    !claims.email ||
    String(claims.email_verified) !== 'true'
  ) {
    throw new ApiError(401, 'auth_003_c_s_07', 'Invalid Google ID token.');
  }

  return { providerAccountId: claims.sub, email: claims.email, displayName: claims.name };
}
