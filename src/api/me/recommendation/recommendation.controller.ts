import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as recommendationService from './recommendation.service';
import {
  createRecommendationFeedbackSchema,
  searchRecommendedJobSchema,
  searchRecommendedTutorSchema,
} from './recommendation.validation';

/**
 * ============================================================================
 * @name    searchRecommendedTutor
 * @code    me_008_tutors_s
 * @route   POST /api/v1/me/recommendations/tutors/search
 * @desc    Search AI-recommended tutors using hybrid scoring and feedback filtering.
 *
 * ============================================================================
 */
export const searchRecommendedTutorHandler = asyncHandler('me_008_tutors_s', async (req) => {
  // Validate request body
  const { body } = searchRecommendedTutorSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const recommendedTutors = await recommendationService.searchRecommendedTutor(body, user);

  // Send response
  return { message: 'Recommended tutors searched successfully.', data: recommendedTutors };
});

/**
 * ============================================================================
 * @name    searchRecommendedJob
 * @code    me_008_jobs_s
 * @route   POST /api/v1/me/recommendations/jobs/search
 * @desc    Search AI-recommended student jobs for the authenticated tutor.
 *
 * ============================================================================
 */
export const searchRecommendedJobHandler = asyncHandler('me_008_jobs_s', async (req) => {
  // Validate request body
  const { body } = searchRecommendedJobSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const recommendedJobs = await recommendationService.searchRecommendedJob(body, user);

  // Send response
  return { message: 'Recommended jobs searched successfully.', data: recommendedJobs };
});

/**
 * ============================================================================
 * @name    createRecommendationFeedback
 * @code    me_008_feedback_c
 * @route   POST /api/v1/me/recommendations/feedback/create
 * @desc    Record user feedback on an AI recommendation.
 *
 * ============================================================================
 */
export const createRecommendationFeedbackHandler = asyncHandler('me_008_feedback_c', async (req) => {
  // Validate request body
  const { body } = createRecommendationFeedbackSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const feedback = await recommendationService.createRecommendationFeedback(body, user);

  // Send response
  return { message: 'Recommendation feedback created successfully.', data: feedback, status: 201 };
});
