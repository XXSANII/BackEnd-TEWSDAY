import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as bookingService from './booking.service';
import {
  cancelBookingSchema,
  createBookingSchema,
  getBookingSchema,
  searchBookingSchema,
} from './booking.validation';

/**
 * ============================================================================
 * @name    createBooking
 * @code    me_006_c
 * @route   POST /api/v1/me/bookings/create
 * @desc    Create a new booking and optionally initialize class sessions.
 *
 * ============================================================================
 */
export const createBookingHandler = asyncHandler('me_006_c', async (req) => {
  // Validate request body
  const { body } = createBookingSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdBooking = await bookingService.createBooking(body, user);

  // Send response
  return { message: 'Booking created successfully.', data: createdBooking, status: 201 };
});

/**
 * ============================================================================
 * @name    searchBooking
 * @code    me_006_s
 * @route   POST /api/v1/me/bookings/search
 * @desc    Search bookings belonging to the authenticated user.
 *
 * ============================================================================
 */
export const searchBookingHandler = asyncHandler('me_006_s', async (req) => {
  // Validate request body
  const { body } = searchBookingSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const searchResult = await bookingService.searchBooking(body, user);

  // Send response
  return { message: 'Bookings searched successfully.', data: searchResult };
});

/**
 * ============================================================================
 * @name    getBooking
 * @code    me_006_g
 * @route   GET /api/v1/me/bookings/:bookingId/get
 * @desc    Retrieve detailed information of a booking.
 *
 * ============================================================================
 */
export const getBookingHandler = asyncHandler('me_006_g', async (req) => {
  // Recheck request info
  const { params } = getBookingSchema.parse(req);
  if (!params.bookingId) {
    throw new Error('Booking info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const booking = await bookingService.getBooking(params, user);

  // Send response
  return { message: 'Booking retrieved successfully.', data: booking };
});

/**
 * ============================================================================
 * @name    cancelBooking
 * @code    me_006_cancel
 * @route   PUT /api/v1/me/bookings/:bookingId/cancel
 * @desc    Cancel an existing booking and its scheduled sessions.
 *
 * ============================================================================
 */
export const cancelBookingHandler = asyncHandler('me_006_cancel', async (req) => {
  // Validate request body
  const { params, body } = cancelBookingSchema.parse(req);
  if (!params.bookingId) {
    throw new Error('Booking info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const cancelledBooking = await bookingService.cancelBooking(params, body, user);

  // Send response
  return { message: 'Booking cancelled successfully.', data: cancelledBooking };
});
