import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import * as tutorService from './tutor.service';
import {
  getPublicTutorAvailabilitySchema,
  getTutorSchema,
  searchTutorReviewSchema,
  searchTutorSchema,
} from './tutor.validation';

/**
 * ============================================================================
 * @name    searchTutor
 * @code    pub_002_s
 * @route   POST /api/v1/public/tutors/search
 * @desc    Search public tutor profiles with subject, rate, and PostGIS radius filters.
 *
 * ============================================================================
 */
export const searchTutorHandler = asyncHandler('pub_002_s', async (req) => {
  // Validate request body
  const { body } = searchTutorSchema.parse(req);

  // Call service
  const searchResult = await tutorService.searchTutor(body);

  // Send response
  return { message: 'Tutors searched successfully.', data: searchResult };
});

/**
 * ============================================================================
 * @name    getTutor
 * @code    pub_002_g
 * @route   GET /api/v1/public/tutors/:tutorId/get
 * @desc    Retrieve public details, subjects, educations, and rating summary of a tutor.
 *
 * ============================================================================
 */
export const getTutorHandler = asyncHandler('pub_002_g', async (req) => {
  // Recheck request info
  const { params } = getTutorSchema.parse(req);
  if (!params.tutorId) {
    throw new Error('Tutor info is missing in request.');
  }

  // Call service
  const tutor = await tutorService.getTutor(params);

  // Send response
  return { message: 'Tutor retrieved successfully.', data: tutor };
});

/**
 * ============================================================================
 * @name    getPublicTutorAvailability
 * @code    pub_002_avail_g
 * @route   GET /api/v1/public/tutors/:tutorId/availability/get
 * @desc    Retrieve public availability slots of a tutor.
 *
 * ============================================================================
 */
export const getPublicTutorAvailabilityHandler = asyncHandler('pub_002_avail_g', async (req) => {
  // Recheck request info
  const { params } = getPublicTutorAvailabilitySchema.parse(req);
  if (!params.tutorId) {
    throw new Error('Tutor info is missing in request.');
  }

  // Call service
  const availability = await tutorService.getPublicTutorAvailability(params);

  // Send response
  return { message: 'Tutor availability retrieved successfully.', data: availability };
});

/**
 * ============================================================================
 * @name    searchTutorReview
 * @code    pub_002_rev_s
 * @route   POST /api/v1/public/tutors/:tutorId/reviews/search
 * @desc    Search published reviews of a tutor.
 *
 * ============================================================================
 */
export const searchTutorReviewHandler = asyncHandler('pub_002_rev_s', async (req) => {
  // Validate request body
  const { params, body } = searchTutorReviewSchema.parse(req);
  if (!params.tutorId) {
    throw new Error('Tutor info is missing in request.');
  }

  // Call service
  const reviewsResult = await tutorService.searchTutorReview(params, body);

  // Send response
  return { message: 'Tutor reviews searched successfully.', data: reviewsResult };
});
