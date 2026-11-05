import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import * as jobService from './job.service';
import {
  getPublicJobSchema,
  searchPublicJobSchema,
  sharePublicJobSchema,
} from './job.validation';

/**
 * ============================================================================
 * @name    searchPublicJob
 * @code    pub_003_s
 * @route   POST /api/v1/public/jobs/search
 * @desc    Search open student job postings in the public marketplace.
 *
 * ============================================================================
 */
export const searchPublicJobHandler = asyncHandler('pub_003_s', async (req) => {
  // Validate request body
  const { body } = searchPublicJobSchema.parse(req);

  // Call service
  const searchResult = await jobService.searchPublicJob(body);

  // Send response
  return { message: 'Public jobs searched successfully.', data: searchResult };
});

/**
 * ============================================================================
 * @name    getPublicJob
 * @code    pub_003_g
 * @route   GET /api/v1/public/jobs/:jobId/get
 * @desc    Retrieve public details of a student job posting.
 *
 * ============================================================================
 */
export const getPublicJobHandler = asyncHandler('pub_003_g', async (req) => {
  // Recheck request info
  const { params } = getPublicJobSchema.parse(req);
  if (!params.jobId) {
    throw new Error('Job info is missing in request.');
  }

  // Call service
  const job = await jobService.getPublicJob(params);

  // Send response
  return { message: 'Public job retrieved successfully.', data: job };
});

/**
 * ============================================================================
 * @name    sharePublicJob
 * @code    pub_003_share
 * @route   POST /api/v1/public/jobs/:jobId/share
 * @desc    Increment the share counter of a student job posting.
 *
 * ============================================================================
 */
export const sharePublicJobHandler = asyncHandler('pub_003_share', async (req) => {
  // Recheck request info
  const { params } = sharePublicJobSchema.parse(req);
  if (!params.jobId) {
    throw new Error('Job info is missing in request.');
  }

  // Call service
  const shareResult = await jobService.sharePublicJob(params);

  // Send response
  return { message: 'Job share recorded successfully.', data: shareResult };
});
