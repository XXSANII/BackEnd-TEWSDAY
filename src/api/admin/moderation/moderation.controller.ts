import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as moderationService from './moderation.service';
import {
  resolveChangeRequestSchema,
  resolveDisputeSchema,
  searchChangeRequestSchema,
  searchCommissionInvoiceSchema,
  searchDisputeSchema,
  searchTutorVerificationSchema,
  suspendUserSchema,
  verifyInvoiceSlipSchema,
  verifyTutorProfileSchema,
} from './moderation.validation';

/**
 * ============================================================================
 * @name    searchTutorVerification
 * @code    adm_001_s
 * @route   POST /api/v1/admin/tutors/verification/search
 * @desc    Search tutor profiles awaiting or completed verification.
 *
 * ============================================================================
 */
export const searchTutorVerificationHandler = asyncHandler('adm_001_s', async (req) => {
  // Validate request body
  const { body } = searchTutorVerificationSchema.parse(req);

  // Call service
  const result = await moderationService.searchTutorVerification(body);

  // Send response
  return { message: 'Tutor verifications searched successfully.', data: result };
});

/**
 * ============================================================================
 * @name    verifyTutorProfile
 * @code    adm_001_verify
 * @route   PUT /api/v1/admin/tutors/:tutorId/verify
 * @desc    Approve or reject a tutor verification status.
 *
 * ============================================================================
 */
export const verifyTutorProfileHandler = asyncHandler('adm_001_verify', async (req) => {
  // Validate request body
  const { params, body } = verifyTutorProfileSchema.parse(req);
  if (!params.tutorId) {
    throw new Error('Tutor info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const verifiedTutor = await moderationService.verifyTutorProfile(params, body, user);

  // Send response
  return { message: 'Tutor verification updated successfully.', data: verifiedTutor };
});

/**
 * ============================================================================
 * @name    searchChangeRequest
 * @code    adm_002_s
 * @route   POST /api/v1/admin/change-requests/search
 * @desc    Search tutor profile change requests.
 *
 * ============================================================================
 */
export const searchChangeRequestHandler = asyncHandler('adm_002_s', async (req) => {
  // Validate request body
  const { body } = searchChangeRequestSchema.parse(req);

  // Call service
  const result = await moderationService.searchChangeRequest(body);

  // Send response
  return { message: 'Profile change requests searched successfully.', data: result };
});

/**
 * ============================================================================
 * @name    resolveChangeRequest
 * @code    adm_002_resolve
 * @route   PUT /api/v1/admin/change-requests/:requestId/resolve
 * @desc    Approve or reject a tutor profile change request.
 *
 * ============================================================================
 */
export const resolveChangeRequestHandler = asyncHandler('adm_002_resolve', async (req) => {
  // Validate request body
  const { params, body } = resolveChangeRequestSchema.parse(req);
  if (!params.requestId) {
    throw new Error('Change request info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const resolvedRequest = await moderationService.resolveChangeRequest(params, body, user);

  // Send response
  return { message: 'Profile change request resolved successfully.', data: resolvedRequest };
});

/**
 * ============================================================================
 * @name    searchCommissionInvoice
 * @code    adm_004_s
 * @route   POST /api/v1/admin/invoices/commission/search
 * @desc    Search monthly commission invoices for admin verification.
 *
 * ============================================================================
 */
export const searchCommissionInvoiceHandler = asyncHandler('adm_004_s', async (req) => {
  // Validate request body
  const { body } = searchCommissionInvoiceSchema.parse(req);

  // Call service
  const result = await moderationService.searchCommissionInvoice(body);

  // Send response
  return { message: 'Commission invoices searched successfully.', data: result };
});

/**
 * ============================================================================
 * @name    verifyInvoiceSlip
 * @code    adm_004_verify
 * @route   PUT /api/v1/admin/invoices/:invoiceId/verify-slip
 * @desc    Verify or reject an uploaded commission payment slip.
 *
 * ============================================================================
 */
export const verifyInvoiceSlipHandler = asyncHandler('adm_004_verify', async (req) => {
  // Validate request body
  const { params, body } = verifyInvoiceSlipSchema.parse(req);
  if (!params.invoiceId) {
    throw new Error('Invoice info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const verifiedInvoice = await moderationService.verifyInvoiceSlip(params, body, user);

  // Send response
  return { message: 'Invoice payment slip verified successfully.', data: verifiedInvoice };
});

/**
 * ============================================================================
 * @name    searchDispute
 * @code    adm_005_s
 * @route   POST /api/v1/admin/disputes/search
 * @desc    Search disputed class sessions requiring mediation.
 *
 * ============================================================================
 */
export const searchDisputeHandler = asyncHandler('adm_005_s', async (req) => {
  // Validate request body
  const { body } = searchDisputeSchema.parse(req);

  // Call service
  const result = await moderationService.searchDispute(body);

  // Send response
  return { message: 'Disputed sessions searched successfully.', data: result };
});

/**
 * ============================================================================
 * @name    resolveDispute
 * @code    adm_005_resolve
 * @route   PUT /api/v1/admin/disputes/:disputeId/resolve
 * @desc    Resolve a disputed class session.
 *
 * ============================================================================
 */
export const resolveDisputeHandler = asyncHandler('adm_005_resolve', async (req) => {
  // Validate request body
  const { params, body } = resolveDisputeSchema.parse(req);
  if (!params.disputeId) {
    throw new Error('Dispute info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const resolvedDispute = await moderationService.resolveDispute(params, body, user);

  // Send response
  return { message: 'Session dispute resolved successfully.', data: resolvedDispute };
});

/**
 * ============================================================================
 * @name    suspendUser
 * @code    adm_006_suspend
 * @route   PUT /api/v1/admin/users/:userId/suspend
 * @desc    Update the account status of a user (suspend, ban, or restore).
 *
 * ============================================================================
 */
export const suspendUserHandler = asyncHandler('adm_006_suspend', async (req) => {
  // Validate request body
  const { params, body } = suspendUserSchema.parse(req);
  if (!params.userId) {
    throw new Error('User info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedUser = await moderationService.suspendUser(params, body, user);

  // Send response
  return { message: 'User status updated successfully.', data: updatedUser };
});
