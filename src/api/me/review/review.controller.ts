import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as reviewService from './review.service';
import { createReviewSchema, searchMyReviewSchema } from './review.validation';

/**
 * ============================================================================
 * @name    createReview
 * @code    me_011_c
 * @route   POST /api/v1/me/sessions/:sessionId/reviews/create
 * @desc    Create a review for a completed class session.
 *
 * ============================================================================
 */
export const createReviewHandler = asyncHandler('me_011_c', async (req) => {
  // Validate request body
  const { params, body } = createReviewSchema.parse(req);
  if (!params.sessionId) {
    throw new Error('Session info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdReview = await reviewService.createReview(params, body, user);

  // Send response
  return { message: 'Review created successfully.', data: createdReview, status: 201 };
});

/**
 * ============================================================================
 * @name    searchMyReview
 * @code    me_011_s
 * @route   POST /api/v1/me/reviews/search
 * @desc    Search reviews written by the authenticated user.
 *
 * ============================================================================
 */
export const searchMyReviewHandler = asyncHandler('me_011_s', async (req) => {
  // Validate request body
  const { body } = searchMyReviewSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const searchResult = await reviewService.searchMyReview(body, user);

  // Send response
  return { message: 'Reviews searched successfully.', data: searchResult };
});
