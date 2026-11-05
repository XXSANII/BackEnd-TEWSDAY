import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as studentService from './student.service';
import {
  editMyStudentProfileSchema,
  editStudentEmergencyContactSchema,
  getMyStudentProfileSchema,
} from './student.validation';

/**
 * ============================================================================
 * @name    getMyStudentProfile
 * @code    me_004_g
 * @route   GET /api/v1/me/student/get
 * @desc    Retrieve the student profile and emergency contact of the authenticated user.
 *
 * ============================================================================
 */
export const getMyStudentProfileHandler = asyncHandler('me_004_g', async (req) => {
  // Recheck request info
  getMyStudentProfileSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const studentProfile = await studentService.getMyStudentProfile(user);

  // Send response
  return { message: 'Student profile retrieved successfully.', data: studentProfile };
});

/**
 * ============================================================================
 * @name    editMyStudentProfile
 * @code    me_004_e
 * @route   PUT /api/v1/me/student/edit
 * @desc    Update the student profile details and location of the authenticated user.
 *
 * ============================================================================
 */
export const editMyStudentProfileHandler = asyncHandler('me_004_e', async (req) => {
  // Validate request body
  const { body } = editMyStudentProfileSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedProfile = await studentService.editMyStudentProfile(body, user);

  // Send response
  return { message: 'Student profile edited successfully.', data: updatedProfile };
});

/**
 * ============================================================================
 * @name    editStudentEmergencyContact
 * @code    me_004_emergency_e
 * @route   PUT /api/v1/me/student/emergency-contact/edit
 * @desc    Update the parent and emergency contact information of the student profile.
 *
 * ============================================================================
 */
export const editStudentEmergencyContactHandler = asyncHandler('me_004_emergency_e', async (req) => {
  // Validate request body
  const { body } = editStudentEmergencyContactSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedContact = await studentService.editStudentEmergencyContact(body, user);

  // Send response
  return { message: 'Emergency contact edited successfully.', data: updatedContact };
});
