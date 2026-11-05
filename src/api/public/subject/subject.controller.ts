import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import * as subjectService from './subject.service';
import { getSubjectSchema, searchSubjectSchema } from './subject.validation';

/**
 * ============================================================================
 * @name    getSubject
 * @code    pub_001_g
 * @route   GET /api/v1/public/subjects/:subjectId/get
 * @desc    Retrieve a subject by its ID.
 *
 * ============================================================================
 */
export const getSubjectHandler = asyncHandler('pub_001_g', async (req) => {
  // Recheck request info
  const { params } = getSubjectSchema.parse(req);
  if (!params.subjectId) {
    throw new Error('Subject info is missing in request.');
  }

  // Call service
  const subject = await subjectService.getSubject(params);

  // Send response
  return { message: 'Subject retrieved successfully.', data: subject };
});

/**
 * ============================================================================
 * @name    searchSubject
 * @code    pub_001_s
 * @route   POST /api/v1/public/subjects/search
 * @desc    Search available subjects with filtering and pagination.
 *
 * ============================================================================
 */
export const searchSubjectHandler = asyncHandler('pub_001_s', async (req) => {
  // Validate request body
  const { body } = searchSubjectSchema.parse(req);

  // Call service
  const searchResult = await subjectService.searchSubject(body);

  // Send response
  return { message: 'Subjects searched successfully.', data: searchResult };
});
