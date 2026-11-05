import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as jobService from './job.service';
import {
  applyStudentJobSchema,
  createStudentJobSchema,
  editJobApplicationStatusSchema,
  editStudentJobStatusSchema,
  searchJobApplicationSchema,
} from './job.validation';

/**
 * ============================================================================
 * @name    createStudentJob
 * @code    me_005_c
 * @route   POST /api/v1/me/jobs/create
 * @desc    Create a new student job posting.
 *
 * ============================================================================
 */
export const createStudentJobHandler = asyncHandler('me_005_c', async (req) => {
  // Validate request body
  const { body } = createStudentJobSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdJob = await jobService.createStudentJob(body, user);

  // Send response
  return { message: 'Student job created successfully.', data: createdJob, status: 201 };
});

/**
 * ============================================================================
 * @name    editStudentJobStatus
 * @code    me_005_status_e
 * @route   PUT /api/v1/me/jobs/:jobId/status/edit
 * @desc    Update the status of a student job posting.
 *
 * ============================================================================
 */
export const editStudentJobStatusHandler = asyncHandler('me_005_status_e', async (req) => {
  // Validate request body
  const { params, body } = editStudentJobStatusSchema.parse(req);
  if (!params.jobId) {
    throw new Error('Job info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedJob = await jobService.editStudentJobStatus(params, body, user);

  // Send response
  return { message: 'Student job status edited successfully.', data: updatedJob };
});

/**
 * ============================================================================
 * @name    searchJobApplication
 * @code    me_005_apps_s
 * @route   POST /api/v1/me/jobs/:jobId/applications/search
 * @desc    Search tutor applications submitted for a student job.
 *
 * ============================================================================
 */
export const searchJobApplicationHandler = asyncHandler('me_005_apps_s', async (req) => {
  // Validate request body
  const { params, body } = searchJobApplicationSchema.parse(req);
  if (!params.jobId) {
    throw new Error('Job info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const applications = await jobService.searchJobApplication(params, body, user);

  // Send response
  return { message: 'Job applications searched successfully.', data: applications };
});

/**
 * ============================================================================
 * @name    applyStudentJob
 * @code    me_005_apply_c
 * @route   POST /api/v1/me/jobs/:jobId/apply
 * @desc    Submit a tutor application to an open student job.
 *
 * ============================================================================
 */
export const applyStudentJobHandler = asyncHandler('me_005_apply_c', async (req) => {
  // Validate request body
  const { params, body } = applyStudentJobSchema.parse(req);
  if (!params.jobId) {
    throw new Error('Job info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdApplication = await jobService.applyStudentJob(params, body, user);

  // Send response
  return { message: 'Job application submitted successfully.', data: createdApplication, status: 201 };
});

/**
 * ============================================================================
 * @name    editJobApplicationStatus
 * @code    me_005_app_status_e
 * @route   PUT /api/v1/me/applications/:applicationId/status/edit
 * @desc    Update the status of a tutor job application.
 *
 * ============================================================================
 */
export const editJobApplicationStatusHandler = asyncHandler('me_005_app_status_e', async (req) => {
  // Validate request body
  const { params, body } = editJobApplicationStatusSchema.parse(req);
  if (!params.applicationId) {
    throw new Error('Application info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedApplication = await jobService.editJobApplicationStatus(params, body, user);

  // Send response
  return { message: 'Job application status edited successfully.', data: updatedApplication };
});
