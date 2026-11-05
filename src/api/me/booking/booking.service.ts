import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditCreate, auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import {
  Booking,
  ClassSession,
  Notification,
  StudentProfile,
  Subject,
  TutorProfile,
} from '@/types/db';
import { UserPayload } from '@/types/express';
import {
  bookingStatusType,
  notificationPriorityType,
  paymentStatusType,
  sessionStatusType,
} from '@/constants/marketplace.constants';
import {
  CancelBookingInput,
  CancelBookingParams,
  CancelBookingResponse,
  CreateBookingInput,
  CreateBookingResponse,
  GetBookingParams,
  GetBookingResponse,
  SearchBookingInput,
  SearchBookingResponse,
  searchBookingValidSortKeys,
} from './booking.validation';

/**
 * ============================================================================
 * @name    me_006_c
 * @desc    Create a new booking and optionally initialize class sessions.
 *
 * ============================================================================
 */
export async function createBooking(
  input: CreateBookingInput,
  user: UserPayload
): Promise<CreateBookingResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    let studentProfile = await trx('StudentProfile')
      .where({ userId: user.userId, isActiveFlag: true })
      .first<StudentProfile>();
    if (!studentProfile) {
      const [created] = await trx('StudentProfile')
        .insert({ userId: user.userId, ...auditCreate(user.userLogName) })
        .returning<StudentProfile[]>('*');
      studentProfile = created;
    }
    if (!studentProfile) {
      throw new ApiError(500, 'me_006_c_s_01', 'Failed to resolve student profile.');
    }

    const tutorProfile = await trx('TutorProfile')
      .where({ tutorProfileId: input.tutorProfileId, isActiveFlag: true })
      .first<TutorProfile>();
    if (!tutorProfile) {
      throw new ApiError(404, 'me_006_c_s_02', 'Tutor profile not found or inactive.');
    }

    const subject = await trx('Subject')
      .where({ subjectId: input.subjectId, isActiveFlag: true })
      .first<Subject>();
    if (!subject) {
      throw new ApiError(404, 'me_006_c_s_03', 'Subject not found or inactive.');
    }

    // Prepare data
    const initialStatus = input.signedContractFileId
      ? bookingStatusType.ACTIVE
      : bookingStatusType.PENDING_CONFIRMATION;

    const newBookingData: Partial<Booking> = {
      studentProfileId: studentProfile.studentProfileId,
      tutorProfileId: tutorProfile.tutorProfileId,
      subjectId: subject.subjectId,
      originatingStudentJobId: input.originatingStudentJobId || null,
      agreedHourlyRate: input.agreedHourlyRate,
      teachingMode: input.teachingMode,
      meetingLocation: input.meetingLocation || null,
      meetingUrl: input.meetingUrl || null,
      signedContractFileId: input.signedContractFileId || null,
      contractUploadedAt: input.signedContractFileId ? new Date() : null,
      status: initialStatus,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdBooking] = await trx('Booking').insert(newBookingData).returning<Booking[]>('*');
    if (!createdBooking) {
      throw new ApiError(500, 'me_006_c_s_04', 'Failed to create booking.');
    }

    let createdSessionsCount = 0;
    if (input.sessions && input.sessions.length > 0) {
      const sessionRows: Partial<ClassSession>[] = input.sessions.map((s) => {
        const grossAmount = Number(((input.agreedHourlyRate * s.durationMinutes) / 60).toFixed(2));
        return {
          bookingId: createdBooking.bookingId,
          studentProfileId: studentProfile.studentProfileId,
          tutorProfileId: tutorProfile.tutorProfileId,
          scheduledStart: new Date(s.scheduledStart),
          scheduledEnd: new Date(s.scheduledEnd),
          hourlyRate: input.agreedHourlyRate,
          durationMinutes: s.durationMinutes,
          grossAmount,
          status: sessionStatusType.SCHEDULED,
          paymentStatus: paymentStatusType.PENDING_PAYMENT,
          ...auditCreate(user.userLogName),
        };
      });
      const insertedSessions = await trx('ClassSession').insert(sessionRows).returning<ClassSession[]>('*');
      createdSessionsCount = insertedSessions.length;
    }

    const notiData: Partial<Notification> = {
      userId: tutorProfile.userId,
      priorityTier: notificationPriorityType.HIGH,
      title: 'New Booking Request',
      body: `${user.displayName} requested a booking for ${subject.name}.`,
      referenceType: 'Booking',
      referenceId: createdBooking.bookingId,
      isReadFlag: false,
      ...auditCreate(user.userLogName),
    };
    await trx('Notification').insert(notiData);

    // Return result
    return {
      bookingId: createdBooking.bookingId,
      status: createdBooking.status,
      createdSessionsCount,
    };
  });
}

/**
 * ============================================================================
 * @name    me_006_s
 * @desc    Search bookings belonging to the authenticated user.
 *
 * ============================================================================
 */
export async function searchBooking(
  input: SearchBookingInput,
  user: UserPayload
): Promise<SearchBookingResponse> {
  // Build query
  let query = db('Booking')
    .join('Subject', 'Booking.subjectId', 'Subject.subjectId')
    .join('StudentProfile', 'Booking.studentProfileId', 'StudentProfile.studentProfileId')
    .join('User as StudentUser', 'StudentProfile.userId', 'StudentUser.userId')
    .join('TutorProfile', 'Booking.tutorProfileId', 'TutorProfile.tutorProfileId')
    .join('User as TutorUser', 'TutorProfile.userId', 'TutorUser.userId')
    .select(
      'Booking.bookingId as bookingId',
      'Booking.studentProfileId as studentProfileId',
      'StudentUser.displayName as studentDisplayName',
      'Booking.tutorProfileId as tutorProfileId',
      'TutorUser.displayName as tutorDisplayName',
      'Booking.subjectId as subjectId',
      'Subject.name as subjectName',
      'Booking.agreedHourlyRate as agreedHourlyRate',
      'Booking.teachingMode as teachingMode',
      'Booking.status as status',
      'Booking.createdAt as createdAt'
    )
    .where({ 'Booking.isActiveFlag': true })
    .andWhere((qb) => {
      qb.where('StudentProfile.userId', user.userId).orWhere('TutorProfile.userId', user.userId);
    });

  // Apply filters
  if (input.status) {
    query = query.where('Booking.status', input.status);
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchBookingValidSortKeys,
  });

  // Apply pagination
  const totalCountResult = await query.clone().clearSelect().clearOrder().count().first<{ count: string }>();
  const totalCount = parseInt(totalCountResult?.count || '0', 10);
  const pagination = calculatePagination({
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    total: totalCount,
    pageAll: input.pageAll,
  });
  query = applyPagination({
    query,
    pageNumber: pagination.currentPage,
    pageSize: pagination.pageSize,
  });

  // Execute the query
  const rows = await query;

  // Return result
  const returnResult: SearchBookingResponse = {
    total: totalCount,
    pagination,
    data: rows.map((row: any) => ({
      bookingId: row.bookingId,
      studentProfileId: row.studentProfileId,
      studentDisplayName: row.studentDisplayName,
      tutorProfileId: row.tutorProfileId,
      tutorDisplayName: row.tutorDisplayName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      agreedHourlyRate: Number(row.agreedHourlyRate),
      teachingMode: row.teachingMode,
      status: row.status,
      createdAt: new Date(row.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_006_g
 * @desc    Retrieve detailed information of a booking.
 *
 * ============================================================================
 */
export async function getBooking(params: GetBookingParams, user: UserPayload): Promise<GetBookingResponse> {
  // Check existing data
  const row = await db('Booking')
    .join('Subject', 'Booking.subjectId', 'Subject.subjectId')
    .join('StudentProfile', 'Booking.studentProfileId', 'StudentProfile.studentProfileId')
    .join('User as StudentUser', 'StudentProfile.userId', 'StudentUser.userId')
    .join('TutorProfile', 'Booking.tutorProfileId', 'TutorProfile.tutorProfileId')
    .join('User as TutorUser', 'TutorProfile.userId', 'TutorUser.userId')
    .select(
      'Booking.*',
      'StudentProfile.userId as studentUserId',
      'StudentUser.displayName as studentDisplayName',
      'TutorProfile.userId as tutorUserId',
      'TutorProfile.paymentDetails as tutorPaymentDetails',
      'TutorUser.displayName as tutorDisplayName',
      'Subject.name as subjectName'
    )
    .where({
      'Booking.bookingId': params.bookingId,
      'Booking.isActiveFlag': true,
    })
    .first<any>();

  if (!row) {
    throw new ApiError(404, 'me_006_g_s_01', 'Booking not found or inactive.');
  }

  if (row.studentUserId !== user.userId && row.tutorUserId !== user.userId && user.role !== 'admin') {
    throw new ApiError(403, 'me_006_g_s_02', 'You do not have permission to view this booking.');
  }

  // Return result
  return {
    bookingId: row.bookingId,
    studentProfileId: row.studentProfileId,
    studentDisplayName: row.studentDisplayName,
    tutorProfileId: row.tutorProfileId,
    tutorDisplayName: row.tutorDisplayName,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    originatingStudentJobId: row.originatingStudentJobId || null,
    agreedHourlyRate: Number(row.agreedHourlyRate),
    teachingMode: row.teachingMode,
    meetingLocation: row.meetingLocation || null,
    meetingUrl: row.meetingUrl || null,
    signedContractFileId: row.signedContractFileId || null,
    contractUploadedAt: row.contractUploadedAt ? new Date(row.contractUploadedAt).toISOString() : null,
    tutorPaymentDetails: (row.tutorPaymentDetails as Record<string, unknown>) || null,
    status: row.status,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/**
 * ============================================================================
 * @name    me_006_cancel
 * @desc    Cancel an existing booking and its scheduled sessions.
 *
 * ============================================================================
 */
export async function cancelBooking(
  params: CancelBookingParams,
  input: CancelBookingInput,
  user: UserPayload
): Promise<CancelBookingResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const row = await trx('Booking')
      .join('StudentProfile', 'Booking.studentProfileId', 'StudentProfile.studentProfileId')
      .join('TutorProfile', 'Booking.tutorProfileId', 'TutorProfile.tutorProfileId')
      .select(
        'Booking.*',
        'StudentProfile.userId as studentUserId',
        'TutorProfile.userId as tutorUserId'
      )
      .where({
        'Booking.bookingId': params.bookingId,
        'Booking.isActiveFlag': true,
      })
      .first<any>();

    if (!row) {
      throw new ApiError(404, 'me_006_cancel_s_01', 'Booking not found or inactive.');
    }

    if (row.studentUserId !== user.userId && row.tutorUserId !== user.userId) {
      throw new ApiError(403, 'me_006_cancel_s_02', 'You do not have permission to cancel this booking.');
    }

    // Update data
    const [updatedBooking] = await trx('Booking')
      .where({ bookingId: row.bookingId })
      .update({
        status: bookingStatusType.CANCELLED,
        ...auditUpdate(user.userLogName),
      })
      .returning<Booking[]>('*');
    if (!updatedBooking) {
      throw new ApiError(500, 'me_006_cancel_s_03', 'Failed to cancel booking.');
    }

    const cancelledSessionStatus =
      row.studentUserId === user.userId
        ? sessionStatusType.CANCELLED_BY_STUDENT
        : sessionStatusType.CANCELLED_BY_TUTOR;

    await trx('ClassSession')
      .where({
        bookingId: row.bookingId,
        status: sessionStatusType.SCHEDULED,
        isActiveFlag: true,
      })
      .update({
        status: cancelledSessionStatus,
        disputeReason: input.reason || null,
        ...auditUpdate(user.userLogName),
      });

    // Return result
    return {
      bookingId: updatedBooking.bookingId,
      status: updatedBooking.status,
    };
  });
}
