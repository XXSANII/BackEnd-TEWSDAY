import { getAuthRedisKey } from '@/utils/cache/getTemplateRedisKey.helper';
import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { redis } from '@/utils/redis';
import {
  ClassSession,
  Invoice,
  ProfileChangeRequest,
  Session,
  TutorProfile,
  User,
} from '@/types/db';
import { UserPayload } from '@/types/express';
import { invoiceStatusType, invoiceTypeType } from '@/constants/billing.constants';
import {
  changeRequestStatusType,
  paymentStatusType,
} from '@/constants/marketplace.constants';
import {
  ResolveChangeRequestInput,
  ResolveChangeRequestParams,
  ResolveChangeRequestResponse,
  ResolveDisputeInput,
  ResolveDisputeParams,
  ResolveDisputeResponse,
  SearchChangeRequestInput,
  SearchChangeRequestResponse,
  searchChangeRequestValidSortKeys,
  SearchCommissionInvoiceInput,
  SearchCommissionInvoiceResponse,
  searchCommissionInvoiceValidSortKeys,
  SearchDisputeInput,
  SearchDisputeResponse,
  searchDisputeValidSortKeys,
  SearchTutorVerificationInput,
  SearchTutorVerificationResponse,
  searchTutorVerificationValidSortKeys,
  SuspendUserInput,
  SuspendUserParams,
  SuspendUserResponse,
  VerifyInvoiceSlipInput,
  VerifyInvoiceSlipParams,
  VerifyInvoiceSlipResponse,
  VerifyTutorProfileInput,
  VerifyTutorProfileParams,
  VerifyTutorProfileResponse,
} from './moderation.validation';

/**
 * ============================================================================
 * @name    adm_001_s
 * @desc    Search tutor profiles awaiting or completed verification.
 *
 * ============================================================================
 */
export async function searchTutorVerification(
  input: SearchTutorVerificationInput
): Promise<SearchTutorVerificationResponse> {
  // Build query
  let query = db('TutorProfile')
    .join('User', 'TutorProfile.userId', 'User.userId')
    .select(
      'TutorProfile.tutorProfileId as tutorProfileId',
      'TutorProfile.userId as userId',
      'User.displayName as displayName',
      'User.email as email',
      'TutorProfile.verificationStatus as verificationStatus',
      'TutorProfile.introVideoFileId as introVideoFileId',
      'TutorProfile.introVideoStatus as introVideoStatus',
      'TutorProfile.createdAt as createdAt',
      'TutorProfile.updatedAt as updatedAt'
    )
    .where({
      'TutorProfile.isActiveFlag': true,
      'User.isActiveFlag': true,
    });

  // Apply filters
  if (input.verificationStatus) {
    query = query.where('TutorProfile.verificationStatus', input.verificationStatus);
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchTutorVerificationValidSortKeys,
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
  const returnResult: SearchTutorVerificationResponse = {
    total: totalCount,
    pagination,
    data: rows.map((row: any) => ({
      tutorProfileId: row.tutorProfileId,
      userId: row.userId,
      displayName: row.displayName,
      email: row.email,
      verificationStatus: row.verificationStatus,
      introVideoFileId: row.introVideoFileId || null,
      introVideoStatus: row.introVideoStatus || null,
      createdAt: new Date(row.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    adm_001_verify
 * @desc    Approve or reject a tutor verification status.
 *
 * ============================================================================
 */
export async function verifyTutorProfile(
  params: VerifyTutorProfileParams,
  input: VerifyTutorProfileInput,
  user: UserPayload
): Promise<VerifyTutorProfileResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingTutor = await trx('TutorProfile')
      .where({ tutorProfileId: params.tutorId, isActiveFlag: true })
      .first<TutorProfile>();
    if (!existingTutor) {
      throw new ApiError(404, 'adm_001_verify_s_01', 'Tutor profile not found or inactive.');
    }

    // Prepare data
    const updateData: Partial<TutorProfile> = {
      verificationStatus: input.verificationStatus,
      ...(input.introVideoStatus !== undefined ? { introVideoStatus: input.introVideoStatus } : {}),
      ...auditUpdate(user.userLogName),
    };

    // Update data
    const [updatedTutor] = await trx('TutorProfile')
      .where({ tutorProfileId: existingTutor.tutorProfileId })
      .update(updateData)
      .returning<TutorProfile[]>('*');
    if (!updatedTutor) {
      throw new ApiError(500, 'adm_001_verify_s_02', 'Failed to update tutor verification status.');
    }

    // Return result
    return {
      tutorProfileId: updatedTutor.tutorProfileId,
      verificationStatus: updatedTutor.verificationStatus,
      introVideoStatus: updatedTutor.introVideoStatus || null,
    };
  });
}

/**
 * ============================================================================
 * @name    adm_002_s
 * @desc    Search tutor profile change requests.
 *
 * ============================================================================
 */
export async function searchChangeRequest(
  input: SearchChangeRequestInput
): Promise<SearchChangeRequestResponse> {
  // Build query
  let query = db('ProfileChangeRequest')
    .select(
      'profileChangeRequestId',
      'tutorProfileId',
      'requestedChanges',
      'supportingDocFileId',
      'status',
      'reviewedBy',
      'reviewedAt',
      'rejectionReason',
      'createdAt'
    )
    .where({ isActiveFlag: true });

  // Apply filters
  if (input.status) {
    query = query.where({ status: input.status });
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchChangeRequestValidSortKeys,
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
  const rows: ProfileChangeRequest[] = await query;

  // Return result
  const returnResult: SearchChangeRequestResponse = {
    total: totalCount,
    pagination,
    data: rows.map((r) => ({
      profileChangeRequestId: r.profileChangeRequestId,
      tutorProfileId: r.tutorProfileId,
      requestedChanges: (r.requestedChanges as Record<string, unknown>) || {},
      supportingDocFileId: r.supportingDocFileId || null,
      status: r.status,
      reviewedBy: r.reviewedBy || null,
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : null,
      rejectionReason: r.rejectionReason || null,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    adm_002_resolve
 * @desc    Approve or reject a tutor profile change request.
 *
 * ============================================================================
 */
export async function resolveChangeRequest(
  params: ResolveChangeRequestParams,
  input: ResolveChangeRequestInput,
  user: UserPayload
): Promise<ResolveChangeRequestResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingReq = await trx('ProfileChangeRequest')
      .where({ profileChangeRequestId: params.requestId, isActiveFlag: true })
      .first<ProfileChangeRequest>();
    if (!existingReq) {
      throw new ApiError(404, 'adm_002_resolve_s_01', 'Profile change request not found or inactive.');
    }

    // Update data
    const now = new Date();
    const [updatedReq] = await trx('ProfileChangeRequest')
      .where({ profileChangeRequestId: existingReq.profileChangeRequestId })
      .update({
        status: input.status,
        reviewedBy: user.userId,
        reviewedAt: now,
        rejectionReason: input.rejectionReason || null,
        ...auditUpdate(user.userLogName),
      })
      .returning<ProfileChangeRequest[]>('*');
    if (!updatedReq) {
      throw new ApiError(500, 'adm_002_resolve_s_02', 'Failed to resolve profile change request.');
    }

    if (input.status === changeRequestStatusType.APPROVED && existingReq.requestedChanges) {
      const changes = existingReq.requestedChanges as Record<string, unknown>;
      if (typeof changes.displayName === 'string' && changes.displayName.trim()) {
        const tutorProfile = await trx('TutorProfile')
          .where({ tutorProfileId: existingReq.tutorProfileId, isActiveFlag: true })
          .first<TutorProfile>();
        if (tutorProfile) {
          await trx('User')
            .where({ userId: tutorProfile.userId })
            .update({
              displayName: changes.displayName.trim(),
              ...auditUpdate(user.userLogName),
            });
        }
      }
    }

    // Return result
    return {
      profileChangeRequestId: updatedReq.profileChangeRequestId,
      status: updatedReq.status,
      reviewedAt: new Date(updatedReq.reviewedAt || now).toISOString(),
    };
  });
}

/**
 * ============================================================================
 * @name    adm_004_s
 * @desc    Search monthly commission invoices for admin verification.
 *
 * ============================================================================
 */
export async function searchCommissionInvoice(
  input: SearchCommissionInvoiceInput
): Promise<SearchCommissionInvoiceResponse> {
  // Build query
  let query = db('Invoice')
    .select(
      'invoiceId',
      'invoiceNumber',
      'payerUserId',
      'amount',
      'commissionFee',
      'status',
      'slipFileId',
      'dueDate',
      'paidAt',
      'createdAt'
    )
    .where({
      invoiceType: invoiceTypeType.TUTOR_COMMISSION,
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
    validColumns: searchCommissionInvoiceValidSortKeys,
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
  const rows: Invoice[] = await query;

  // Return result
  const returnResult: SearchCommissionInvoiceResponse = {
    total: totalCount,
    pagination,
    data: rows.map((inv) => ({
      invoiceId: inv.invoiceId,
      invoiceNumber: inv.invoiceNumber,
      payerUserId: inv.payerUserId,
      amount: Number(inv.amount),
      commissionFee: Number(inv.commissionFee),
      status: inv.status,
      slipFileId: inv.slipFileId || null,
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString() : null,
      paidAt: inv.paidAt ? new Date(inv.paidAt).toISOString() : null,
      createdAt: new Date(inv.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    adm_004_verify
 * @desc    Verify or reject an uploaded commission payment slip.
 *
 * ============================================================================
 */
export async function verifyInvoiceSlip(
  params: VerifyInvoiceSlipParams,
  input: VerifyInvoiceSlipInput,
  user: UserPayload
): Promise<VerifyInvoiceSlipResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const invoice = await trx('Invoice')
      .where({ invoiceId: params.invoiceId, isActiveFlag: true })
      .first<Invoice>();
    if (!invoice) {
      throw new ApiError(404, 'adm_004_verify_s_01', 'Invoice not found or inactive.');
    }

    // Update data
    const [updatedInvoice] = await trx('Invoice')
      .where({ invoiceId: invoice.invoiceId })
      .update({
        status: input.status,
        verifiedBy: input.status === invoiceStatusType.PAID ? user.userId : null,
        ...auditUpdate(user.userLogName),
      })
      .returning<Invoice[]>('*');
    if (!updatedInvoice) {
      throw new ApiError(500, 'adm_004_verify_s_02', 'Failed to verify invoice payment slip.');
    }

    // Return result
    return {
      invoiceId: updatedInvoice.invoiceId,
      status: updatedInvoice.status,
      verifiedBy: updatedInvoice.verifiedBy || null,
    };
  });
}

/**
 * ============================================================================
 * @name    adm_005_s
 * @desc    Search disputed class sessions requiring mediation.
 *
 * ============================================================================
 */
export async function searchDispute(input: SearchDisputeInput): Promise<SearchDisputeResponse> {
  // Build query
  let query = db('ClassSession')
    .select(
      'classSessionId',
      'bookingId',
      'studentProfileId',
      'tutorProfileId',
      'grossAmount',
      'status',
      'paymentStatus',
      'disputeReason',
      'scheduledStart',
      'createdAt'
    )
    .where({
      paymentStatus: paymentStatusType.DISPUTED,
      isActiveFlag: true,
    });

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchDisputeValidSortKeys,
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
  const rows: ClassSession[] = await query;

  // Return result
  const returnResult: SearchDisputeResponse = {
    total: totalCount,
    pagination,
    data: rows.map((s) => ({
      classSessionId: s.classSessionId,
      bookingId: s.bookingId,
      studentProfileId: s.studentProfileId,
      tutorProfileId: s.tutorProfileId,
      grossAmount: Number(s.grossAmount),
      status: s.status,
      paymentStatus: s.paymentStatus,
      disputeReason: s.disputeReason || null,
      createdAt: new Date(s.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    adm_005_resolve
 * @desc    Resolve a disputed class session.
 *
 * ============================================================================
 */
export async function resolveDispute(
  params: ResolveDisputeParams,
  input: ResolveDisputeInput,
  user: UserPayload
): Promise<ResolveDisputeResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingSession = await trx('ClassSession')
      .where({ classSessionId: params.disputeId, isActiveFlag: true })
      .first<ClassSession>();
    if (!existingSession) {
      throw new ApiError(404, 'adm_005_resolve_s_01', 'Disputed class session not found or inactive.');
    }

    // Update data
    const [updatedSession] = await trx('ClassSession')
      .where({ classSessionId: existingSession.classSessionId })
      .update({
        status: input.status,
        paymentStatus: input.paymentStatus,
        ...auditUpdate(user.userLogName),
      })
      .returning<ClassSession[]>('*');
    if (!updatedSession) {
      throw new ApiError(500, 'adm_005_resolve_s_02', 'Failed to resolve session dispute.');
    }

    // Return result
    return {
      classSessionId: updatedSession.classSessionId,
      status: updatedSession.status,
      paymentStatus: updatedSession.paymentStatus,
    };
  });
}

/**
 * ============================================================================
 * @name    adm_006_suspend
 * @desc    Update the account status of a user (suspend, ban, or restore).
 *
 * ============================================================================
 */
export async function suspendUser(
  params: SuspendUserParams,
  input: SuspendUserInput,
  user: UserPayload
): Promise<SuspendUserResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingUser = await trx('User')
      .where({ userId: params.userId, isActiveFlag: true })
      .first<User>();
    if (!existingUser) {
      throw new ApiError(404, 'adm_006_suspend_s_01', 'User not found or inactive.');
    }

    // Update data
    const [updatedUser] = await trx('User')
      .where({ userId: existingUser.userId })
      .update({
        status: input.status,
        ...auditUpdate(user.userLogName),
      })
      .returning<User[]>('*');
    if (!updatedUser) {
      throw new ApiError(500, 'adm_006_suspend_s_02', 'Failed to update user status.');
    }

    // Invalidate cache
    const activeSessions = await trx('Session')
      .select('token')
      .where({ userId: existingUser.userId, isActiveFlag: true });
    for (const session of activeSessions as Session[]) {
      await redis.del(getAuthRedisKey(session.token));
    }

    // Return result
    return {
      userId: updatedUser.userId,
      status: updatedUser.status,
    };
  });
}
