import crypto from 'crypto';
import { appConfig } from '@/config/app.config';
import { env } from '@/config/env';
import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditCreate, auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { ClassSession, Invoice, InvoiceItem, User } from '@/types/db';
import { UserPayload } from '@/types/express';
import { invoiceStatusType, invoiceTypeType } from '@/constants/billing.constants';
import { paymentStatusType, sessionStatusType } from '@/constants/marketplace.constants';
import { systemRoleType } from '@/constants/user.constants';
import {
  CompleteClassSessionInput,
  CompleteClassSessionParams,
  CompleteClassSessionResponse,
  ConfirmSessionAttendanceParams,
  ConfirmSessionAttendanceResponse,
  DisputeClassSessionInput,
  DisputeClassSessionParams,
  DisputeClassSessionResponse,
  SearchClassSessionInput,
  SearchClassSessionParams,
  SearchClassSessionResponse,
  searchClassSessionValidSortKeys,
  StartClassSessionParams,
  StartClassSessionResponse,
} from './session.validation';

/**
 * ============================================================================
 * @name    me_007_s
 * @desc    Search class sessions belonging to a booking.
 *
 * ============================================================================
 */
export async function searchClassSession(
  params: SearchClassSessionParams,
  input: SearchClassSessionInput,
  user: UserPayload
): Promise<SearchClassSessionResponse> {
  // Check existing data
  const bookingRow = await db('Booking')
    .join('StudentProfile', 'Booking.studentProfileId', 'StudentProfile.studentProfileId')
    .join('TutorProfile', 'Booking.tutorProfileId', 'TutorProfile.tutorProfileId')
    .select(
      'Booking.bookingId as bookingId',
      'StudentProfile.userId as studentUserId',
      'TutorProfile.userId as tutorUserId'
    )
    .where({
      'Booking.bookingId': params.bookingId,
      'Booking.isActiveFlag': true,
    })
    .first<any>();

  if (!bookingRow) {
    throw new ApiError(404, 'me_007_s_s_01', 'Booking not found or inactive.');
  }

  if (bookingRow.studentUserId !== user.userId && bookingRow.tutorUserId !== user.userId && user.role !== 'admin') {
    throw new ApiError(403, 'me_007_s_s_02', 'You do not have permission to view sessions for this booking.');
  }

  // Build query
  let query = db('ClassSession')
    .select(
      'classSessionId',
      'bookingId',
      'scheduledStart',
      'scheduledEnd',
      'actualStart',
      'actualEnd',
      'hourlyRate',
      'durationMinutes',
      'grossAmount',
      'lessonFeedback',
      'homeworkAssigned',
      'status',
      'paymentStatus',
      'disputeReason',
      'studentConfirmedAt',
      'tutorConfirmedAt',
      'createdAt'
    )
    .where({
      bookingId: params.bookingId,
      isActiveFlag: true,
    });

  // Apply filters
  if (input.status) {
    query = query.where({ status: input.status });
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchClassSessionValidSortKeys,
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
  const sessions: ClassSession[] = await query;

  // Return result
  const returnResult: SearchClassSessionResponse = {
    total: totalCount,
    pagination,
    data: sessions.map((s) => ({
      classSessionId: s.classSessionId,
      bookingId: s.bookingId,
      scheduledStart: new Date(s.scheduledStart).toISOString(),
      scheduledEnd: new Date(s.scheduledEnd).toISOString(),
      actualStart: s.actualStart ? new Date(s.actualStart).toISOString() : null,
      actualEnd: s.actualEnd ? new Date(s.actualEnd).toISOString() : null,
      hourlyRate: Number(s.hourlyRate),
      durationMinutes: Number(s.durationMinutes),
      grossAmount: Number(s.grossAmount),
      lessonFeedback: s.lessonFeedback || null,
      homeworkAssigned: s.homeworkAssigned || null,
      status: s.status,
      paymentStatus: s.paymentStatus,
      disputeReason: s.disputeReason || null,
      studentConfirmedAt: s.studentConfirmedAt ? new Date(s.studentConfirmedAt).toISOString() : null,
      tutorConfirmedAt: s.tutorConfirmedAt ? new Date(s.tutorConfirmedAt).toISOString() : null,
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_007_start
 * @desc    Mark a scheduled class session as started by the tutor.
 *
 * ============================================================================
 */
export async function startClassSession(
  params: StartClassSessionParams,
  user: UserPayload
): Promise<StartClassSessionResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const sessionRow = await trx('ClassSession')
      .join('TutorProfile', 'ClassSession.tutorProfileId', 'TutorProfile.tutorProfileId')
      .select('ClassSession.*', 'TutorProfile.userId as tutorUserId')
      .where({
        'ClassSession.classSessionId': params.sessionId,
        'ClassSession.isActiveFlag': true,
      })
      .first<any>();

    if (!sessionRow) {
      throw new ApiError(404, 'me_007_start_s_01', 'Class session not found or inactive.');
    }

    if (sessionRow.tutorUserId !== user.userId) {
      throw new ApiError(403, 'me_007_start_s_02', 'Only the assigned tutor can start this session.');
    }

    // Update data
    const now = new Date();
    const [updatedSession] = await trx('ClassSession')
      .where({ classSessionId: sessionRow.classSessionId })
      .update({
        status: sessionStatusType.IN_PROGRESS,
        actualStart: now,
        ...auditUpdate(user.userLogName),
      })
      .returning<ClassSession[]>('*');
    if (!updatedSession) {
      throw new ApiError(500, 'me_007_start_s_03', 'Failed to start class session.');
    }

    // Return result
    return {
      classSessionId: updatedSession.classSessionId,
      status: updatedSession.status,
      actualStart: new Date(updatedSession.actualStart || now).toISOString(),
    };
  });
}

/**
 * ============================================================================
 * @name    me_007_complete
 * @desc    Claim completion of a class session and record lesson feedback.
 *
 * ============================================================================
 */
export async function completeClassSession(
  params: CompleteClassSessionParams,
  input: CompleteClassSessionInput,
  user: UserPayload
): Promise<CompleteClassSessionResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const sessionRow = await trx('ClassSession')
      .join('TutorProfile', 'ClassSession.tutorProfileId', 'TutorProfile.tutorProfileId')
      .select('ClassSession.*', 'TutorProfile.userId as tutorUserId')
      .where({
        'ClassSession.classSessionId': params.sessionId,
        'ClassSession.isActiveFlag': true,
      })
      .first<any>();

    if (!sessionRow) {
      throw new ApiError(404, 'me_007_complete_s_01', 'Class session not found or inactive.');
    }

    if (sessionRow.tutorUserId !== user.userId) {
      throw new ApiError(403, 'me_007_complete_s_02', 'Only the assigned tutor can complete this session.');
    }

    // Update data
    const now = new Date();
    const [updatedSession] = await trx('ClassSession')
      .where({ classSessionId: sessionRow.classSessionId })
      .update({
        status: sessionStatusType.COMPLETED,
        actualEnd: now,
        completionClaimedAt: now,
        tutorConfirmedAt: now,
        lessonFeedback: input.lessonFeedback ?? sessionRow.lessonFeedback,
        homeworkAssigned: input.homeworkAssigned ?? sessionRow.homeworkAssigned,
        ...auditUpdate(user.userLogName),
      })
      .returning<ClassSession[]>('*');
    if (!updatedSession) {
      throw new ApiError(500, 'me_007_complete_s_03', 'Failed to complete class session.');
    }

    // Return result
    return {
      classSessionId: updatedSession.classSessionId,
      status: updatedSession.status,
      actualEnd: new Date(updatedSession.actualEnd || now).toISOString(),
      completionClaimedAt: new Date(updatedSession.completionClaimedAt || now).toISOString(),
    };
  });
}

/**
 * ============================================================================
 * @name    me_007_confirm
 * @desc    Confirm student attendance for a session and record platform commission.
 *
 * ============================================================================
 */
export async function confirmSessionAttendance(
  params: ConfirmSessionAttendanceParams,
  user: UserPayload
): Promise<ConfirmSessionAttendanceResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const sessionRow = await trx('ClassSession')
      .join('StudentProfile', 'ClassSession.studentProfileId', 'StudentProfile.studentProfileId')
      .join('TutorProfile', 'ClassSession.tutorProfileId', 'TutorProfile.tutorProfileId')
      .select(
        'ClassSession.*',
        'StudentProfile.userId as studentUserId',
        'TutorProfile.userId as tutorUserId'
      )
      .where({
        'ClassSession.classSessionId': params.sessionId,
        'ClassSession.isActiveFlag': true,
      })
      .first<any>();

    if (!sessionRow) {
      throw new ApiError(404, 'me_007_confirm_s_01', 'Class session not found or inactive.');
    }

    if (sessionRow.studentUserId !== user.userId) {
      throw new ApiError(403, 'me_007_confirm_s_02', 'Only the assigned student can confirm attendance.');
    }

    // Update data
    const now = new Date();
    const [updatedSession] = await trx('ClassSession')
      .where({ classSessionId: sessionRow.classSessionId })
      .update({
        status: sessionStatusType.COMPLETED,
        paymentStatus: paymentStatusType.STUDENT_PAID,
        studentConfirmedAt: now,
        ...auditUpdate(user.userLogName),
      })
      .returning<ClassSession[]>('*');
    if (!updatedSession) {
      throw new ApiError(500, 'me_007_confirm_s_03', 'Failed to confirm session attendance.');
    }

    const existingInvoiceItem = await trx('InvoiceItem')
      .where({ classSessionId: updatedSession.classSessionId, isActiveFlag: true })
      .first<InvoiceItem>();

    if (!existingInvoiceItem) {
      const commissionRate = appConfig.billing.COMMISSION_RATE_STANDARD;
      const grossAmount = Number(updatedSession.grossAmount || 0);
      const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));

      let platformPayeeUserId = env.PLATFORM_PAYEE_USER_ID;
      if (!platformPayeeUserId) {
        const adminUser = await trx('User')
          .where({ role: systemRoleType.ADMIN, isActiveFlag: true })
          .first<User>();
        platformPayeeUserId = adminUser?.userId || sessionRow.tutorUserId;
      }

      const invoiceNumber = `INV-COM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const dueDate = new Date(now.getTime() + appConfig.billing.GRACE_DAYS * 24 * 60 * 60 * 1000);

      const newInvoiceData: Partial<Invoice> = {
        invoiceNumber,
        invoiceType: invoiceTypeType.TUTOR_COMMISSION,
        bookingId: updatedSession.bookingId,
        classSessionId: updatedSession.classSessionId,
        payerUserId: sessionRow.tutorUserId,
        payeeUserId: platformPayeeUserId,
        commissionRateSnapshot: commissionRate,
        amount: commissionAmount,
        commissionFee: commissionAmount,
        status: invoiceStatusType.UNPAID,
        dueDate,
        ...auditCreate(user.userLogName),
      };

      const [createdInvoice] = await trx('Invoice').insert(newInvoiceData).returning<Invoice[]>('*');
      if (createdInvoice) {
        const newItemData: Partial<InvoiceItem> = {
          invoiceId: createdInvoice.invoiceId,
          classSessionId: updatedSession.classSessionId,
          sessionGrossAmount: grossAmount,
          commissionRate,
          commissionAmount,
          ...auditCreate(user.userLogName),
        };
        await trx('InvoiceItem').insert(newItemData);
      }
    }

    // Return result
    return {
      classSessionId: updatedSession.classSessionId,
      status: updatedSession.status,
      paymentStatus: updatedSession.paymentStatus,
      studentConfirmedAt: new Date(updatedSession.studentConfirmedAt || now).toISOString(),
    };
  });
}

/**
 * ============================================================================
 * @name    me_007_dispute
 * @desc    Open a dispute for a class session.
 *
 * ============================================================================
 */
export async function disputeClassSession(
  params: DisputeClassSessionParams,
  input: DisputeClassSessionInput,
  user: UserPayload
): Promise<DisputeClassSessionResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const sessionRow = await trx('ClassSession')
      .join('StudentProfile', 'ClassSession.studentProfileId', 'StudentProfile.studentProfileId')
      .join('TutorProfile', 'ClassSession.tutorProfileId', 'TutorProfile.tutorProfileId')
      .select(
        'ClassSession.*',
        'StudentProfile.userId as studentUserId',
        'TutorProfile.userId as tutorUserId'
      )
      .where({
        'ClassSession.classSessionId': params.sessionId,
        'ClassSession.isActiveFlag': true,
      })
      .first<any>();

    if (!sessionRow) {
      throw new ApiError(404, 'me_007_dispute_s_01', 'Class session not found or inactive.');
    }

    if (sessionRow.studentUserId !== user.userId && sessionRow.tutorUserId !== user.userId) {
      throw new ApiError(403, 'me_007_dispute_s_02', 'You do not have permission to dispute this session.');
    }

    // Update data
    const [updatedSession] = await trx('ClassSession')
      .where({ classSessionId: sessionRow.classSessionId })
      .update({
        paymentStatus: paymentStatusType.DISPUTED,
        disputeReason: input.disputeReason,
        ...auditUpdate(user.userLogName),
      })
      .returning<ClassSession[]>('*');
    if (!updatedSession) {
      throw new ApiError(500, 'me_007_dispute_s_03', 'Failed to file session dispute.');
    }

    // Return result
    return {
      classSessionId: updatedSession.classSessionId,
      status: updatedSession.status,
      disputeReason: updatedSession.disputeReason || input.disputeReason,
    };
  });
}
