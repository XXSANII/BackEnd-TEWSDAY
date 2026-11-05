import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as sessionService from './session.service';
import {
  completeClassSessionSchema,
  confirmSessionAttendanceSchema,
  disputeClassSessionSchema,
  searchClassSessionSchema,
  startClassSessionSchema,
} from './session.validation';

/**
 * ============================================================================
 * @name    searchClassSession
 * @code    me_007_s
 * @route   POST /api/v1/me/bookings/:bookingId/sessions/search
 * @desc    Search class sessions belonging to a booking.
 *
 * ============================================================================
 */
export const searchClassSessionHandler = asyncHandler('me_007_s', async (req) => {
  // Validate request body
  const { params, body } = searchClassSessionSchema.parse(req);
  if (!params.bookingId) {
    throw new Error('Booking info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const sessionsResult = await sessionService.searchClassSession(params, body, user);

  // Send response
  return { message: 'Class sessions searched successfully.', data: sessionsResult };
});

/**
 * ============================================================================
 * @name    startClassSession
 * @code    me_007_start
 * @route   POST /api/v1/me/sessions/:sessionId/start
 * @desc    Mark a scheduled class session as started by the tutor.
 *
 * ============================================================================
 */
export const startClassSessionHandler = asyncHandler('me_007_start', async (req) => {
  // Recheck request info
  const { params } = startClassSessionSchema.parse(req);
  if (!params.sessionId) {
    throw new Error('Session info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const startedSession = await sessionService.startClassSession(params, user);

  // Send response
  return { message: 'Class session started successfully.', data: startedSession };
});

/**
 * ============================================================================
 * @name    completeClassSession
 * @code    me_007_complete
 * @route   POST /api/v1/me/sessions/:sessionId/complete
 * @desc    Claim completion of a class session and record lesson feedback.
 *
 * ============================================================================
 */
export const completeClassSessionHandler = asyncHandler('me_007_complete', async (req) => {
  // Validate request body
  const { params, body } = completeClassSessionSchema.parse(req);
  if (!params.sessionId) {
    throw new Error('Session info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const completedSession = await sessionService.completeClassSession(params, body, user);

  // Send response
  return { message: 'Class session completed successfully.', data: completedSession };
});

/**
 * ============================================================================
 * @name    confirmSessionAttendance
 * @code    me_007_confirm
 * @route   POST /api/v1/me/sessions/:sessionId/confirm-attendance
 * @desc    Confirm student attendance for a session and record platform commission.
 *
 * ============================================================================
 */
export const confirmSessionAttendanceHandler = asyncHandler('me_007_confirm', async (req) => {
  // Recheck request info
  const { params } = confirmSessionAttendanceSchema.parse(req);
  if (!params.sessionId) {
    throw new Error('Session info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const confirmedSession = await sessionService.confirmSessionAttendance(params, user);

  // Send response
  return { message: 'Session attendance confirmed successfully.', data: confirmedSession };
});

/**
 * ============================================================================
 * @name    disputeClassSession
 * @code    me_007_dispute
 * @route   POST /api/v1/me/sessions/:sessionId/dispute
 * @desc    Open a dispute for a class session.
 *
 * ============================================================================
 */
export const disputeClassSessionHandler = asyncHandler('me_007_dispute', async (req) => {
  // Validate request body
  const { params, body } = disputeClassSessionSchema.parse(req);
  if (!params.sessionId) {
    throw new Error('Session info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const disputedSession = await sessionService.disputeClassSession(params, body, user);

  // Send response
  return { message: 'Session dispute filed successfully.', data: disputedSession };
});
