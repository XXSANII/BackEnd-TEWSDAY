import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as tutorService from './tutor.service';
import {
  createProfileChangeRequestSchema,
  createTutorEducationSchema,
  deleteTutorEducationSchema,
  editMyTutorProfileSchema,
  editTutorAvailabilitySchema,
  getMyTutorProfileSchema,
  getTutorAvailabilitySchema,
} from './tutor.validation';

/**
 * ============================================================================
 * @name    getMyTutorProfile
 * @code    me_003_g
 * @route   GET /api/v1/me/tutor/get
 * @desc    Retrieve the tutor profile, subjects, and education of the authenticated user.
 *
 * ============================================================================
 */
export const getMyTutorProfileHandler = asyncHandler('me_003_g', async (req) => {
  // Recheck request info
  getMyTutorProfileSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const tutorProfile = await tutorService.getMyTutorProfile(user);

  // Send response
  return { message: 'Tutor profile retrieved successfully.', data: tutorProfile };
});

/**
 * ============================================================================
 * @name    editMyTutorProfile
 * @code    me_003_e
 * @route   PUT /api/v1/me/tutor/edit
 * @desc    Update the tutor profile and taught subjects of the authenticated user.
 *
 * ============================================================================
 */
export const editMyTutorProfileHandler = asyncHandler('me_003_e', async (req) => {
  // Validate request body
  const { body } = editMyTutorProfileSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedProfile = await tutorService.editMyTutorProfile(body, user);

  // Send response
  return { message: 'Tutor profile edited successfully.', data: updatedProfile };
});

/**
 * ============================================================================
 * @name    createTutorEducation
 * @code    me_003_edu_c
 * @route   POST /api/v1/me/tutor/education/create
 * @desc    Add an education record to the tutor profile.
 *
 * ============================================================================
 */
export const createTutorEducationHandler = asyncHandler('me_003_edu_c', async (req) => {
  // Validate request body
  const { body } = createTutorEducationSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdEdu = await tutorService.createTutorEducation(body, user);

  // Send response
  return { message: 'Tutor education created successfully.', data: createdEdu, status: 201 };
});

/**
 * ============================================================================
 * @name    deleteTutorEducation
 * @code    me_003_edu_d
 * @route   DELETE /api/v1/me/tutor/education/:eduId/delete
 * @desc    Soft-delete an education record from the tutor profile.
 *
 * ============================================================================
 */
export const deleteTutorEducationHandler = asyncHandler('me_003_edu_d', async (req) => {
  // Recheck request info
  const { params } = deleteTutorEducationSchema.parse(req);
  if (!params.eduId) {
    throw new Error('Education info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const deletedEdu = await tutorService.deleteTutorEducation(params, user);

  // Send response
  return { message: 'Tutor education deleted successfully.', data: deletedEdu };
});

/**
 * ============================================================================
 * @name    getTutorAvailability
 * @code    me_003_avail_g
 * @route   GET /api/v1/me/tutor/availability/get
 * @desc    Retrieve the availability schedule of the authenticated tutor.
 *
 * ============================================================================
 */
export const getTutorAvailabilityHandler = asyncHandler('me_003_avail_g', async (req) => {
  // Recheck request info
  getTutorAvailabilitySchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const availability = await tutorService.getTutorAvailability(user);

  // Send response
  return { message: 'Tutor availability retrieved successfully.', data: availability };
});

/**
 * ============================================================================
 * @name    editTutorAvailability
 * @code    me_003_avail_e
 * @route   PUT /api/v1/me/tutor/availability/edit
 * @desc    Replace the availability schedule of the authenticated tutor.
 *
 * ============================================================================
 */
export const editTutorAvailabilityHandler = asyncHandler('me_003_avail_e', async (req) => {
  // Validate request body
  const { body } = editTutorAvailabilitySchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedAvailability = await tutorService.editTutorAvailability(body, user);

  // Send response
  return { message: 'Tutor availability edited successfully.', data: updatedAvailability };
});

/**
 * ============================================================================
 * @name    createProfileChangeRequest
 * @code    me_003_req_c
 * @route   POST /api/v1/me/tutor/change-requests/create
 * @desc    Submit a tutor profile change request requiring admin approval.
 *
 * ============================================================================
 */
export const createProfileChangeRequestHandler = asyncHandler('me_003_req_c', async (req) => {
  // Validate request body
  const { body } = createProfileChangeRequestSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdRequest = await tutorService.createProfileChangeRequest(body, user);

  // Send response
  return { message: 'Profile change request created successfully.', data: createdRequest, status: 201 };
});
