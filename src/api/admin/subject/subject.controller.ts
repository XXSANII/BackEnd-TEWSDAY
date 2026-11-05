import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as subjectService from './subject.service';
import { createSubjectSchema, editSubjectSchema } from './subject.validation';

/**
 * ============================================================================
 * @name    createSubject
 * @code    adm_003_c
 * @route   POST /api/v1/admin/subjects/create
 * @desc    Create a new subject in the catalog.
 *
 * ============================================================================
 */
export const createSubjectHandler = asyncHandler('adm_003_c', async (req) => {
  // Validate request body
  const { body } = createSubjectSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdSubject = await subjectService.createSubject(body, user);

  // Send response
  return { message: 'Subject created successfully.', data: createdSubject, status: 201 };
});

/**
 * ============================================================================
 * @name    editSubject
 * @code    adm_003_e
 * @route   PUT /api/v1/admin/subjects/:subjectId/edit
 * @desc    Edit an existing subject in the catalog.
 *
 * ============================================================================
 */
export const editSubjectHandler = asyncHandler('adm_003_e', async (req) => {
  // Validate request body
  const { params, body } = editSubjectSchema.parse(req);
  if (!params.subjectId) {
    throw new Error('Subject info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const updatedSubject = await subjectService.editSubject(params, body, user);

  // Send response
  return { message: 'Subject edited successfully.', data: updatedSubject };
});
