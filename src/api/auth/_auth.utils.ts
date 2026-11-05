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
