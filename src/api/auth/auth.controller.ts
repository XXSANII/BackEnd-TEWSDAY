import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as authService from './auth.service';
import {
  deleteSessionSchema,
  loginSchema,
  logoutSchema,
  oauthLoginSchema,
  refreshTokenSchema,
  registerSchema,
  searchSessionSchema,
} from './auth.validation';

/**
 * ============================================================================
 * @name    register
 * @code    auth_001_c
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account and establish a session.
 *
 * ============================================================================
 */
export const registerHandler = asyncHandler('auth_001_c', async (req) => {
  // Validate request body
  const { body } = registerSchema.parse(req);
  const headers = {
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
    deviceId: (req.headers['x-device-id'] as string) || null,
  };

  // Call service
  const registeredSession = await authService.register(body, headers);

  // Send response
  return { message: 'User registered successfully.', data: registeredSession, status: 201 };
});

/**
 * ============================================================================
 * @name    login
 * @code    auth_002_c
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate a user with email and password and establish a session.
 *
 * ============================================================================
 */
export const loginHandler = asyncHandler('auth_002_c', async (req) => {
  // Validate request body
  const { body } = loginSchema.parse(req);
  const headers = {
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
    deviceId: (req.headers['x-device-id'] as string) || null,
  };

  // Call service
  const loginSession = await authService.login(body, headers);

  // Send response
  return { message: 'User signed in successfully.', data: loginSession };
});

/**
 * ============================================================================
 * @name    oauthLogin
 * @code    auth_003_c
 * @route   POST /api/v1/auth/oauth/:provider
 * @desc    Authenticate or register a user via OAuth provider and establish a session.
 *
 * ============================================================================
 */
export const oauthLoginHandler = asyncHandler('auth_003_c', async (req) => {
  // Validate request body
  const { params, body } = oauthLoginSchema.parse(req);
  if (!params.provider) {
    throw new Error('Provider info is missing in request.');
  }
  const headers = {
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
    deviceId: (req.headers['x-device-id'] as string) || null,
  };

  // Call service
  const oauthSession = await authService.oauthLogin(params, body, headers);

  // Send response
  return { message: 'OAuth sign-in completed successfully.', data: oauthSession };
});

/**
 * ============================================================================
 * @name    refreshToken
 * @code    auth_004_c
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Rotate an active session token and extend its expiration timestamp.
 *
 * ============================================================================
 */
export const refreshTokenHandler = asyncHandler('auth_004_c', async (req) => {
  // Validate request body
  const { body } = refreshTokenSchema.parse(req);
  const headers = {
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
    deviceId: (req.headers['x-device-id'] as string) || null,
  };

  // Call service
  const refreshedSession = await authService.refreshToken(body, headers);

  // Send response
  return { message: 'Session token refreshed successfully.', data: refreshedSession };
});

/**
 * ============================================================================
 * @name    logout
 * @code    auth_005_c
 * @route   POST /api/v1/auth/logout
 * @desc    Sign out the current user session and revoke its token.
 *
 * ============================================================================
 */
export const logoutHandler = asyncHandler('auth_005_c', async (req) => {
  // Validate request body
  logoutSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const logoutResult = await authService.logout(user);

  // Send response
  return { message: 'Session signed out successfully.', data: logoutResult };
});

/**
 * ============================================================================
 * @name    searchSession
 * @code    auth_006_s
 * @route   POST /api/v1/auth/sessions/search
 * @desc    Search active sessions of the authenticated user.
 *
 * ============================================================================
 */
export const searchSessionHandler = asyncHandler('auth_006_s', async (req) => {
  // Validate request body
  const { body } = searchSessionSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const searchResult = await authService.searchSession(body, user);

  // Send response
  return { message: 'Sessions searched successfully.', data: searchResult };
});

/**
 * ============================================================================
 * @name    deleteSession
 * @code    auth_006_d
 * @route   DELETE /api/v1/auth/sessions/:sessionId/delete
 * @desc    Revoke a specific active session belonging to the authenticated user.
 *
 * ============================================================================
 */
export const deleteSessionHandler = asyncHandler('auth_006_d', async (req) => {
  // Recheck request info
  const { params } = deleteSessionSchema.parse(req);
  if (!params.sessionId) {
    throw new Error('Session info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const deletedSession = await authService.deleteSession(params, user);

  // Send response
  return { message: 'Session deleted successfully.', data: deletedSession };
});
