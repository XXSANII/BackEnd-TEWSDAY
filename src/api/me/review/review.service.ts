import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditCreate, auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { Review } from '@/types/db';
import { UserPayload } from '@/types/express';
import { reviewType, sessionStatusType } from '@/constants/marketplace.constants';
import {
  CreateReviewInput,
  CreateReviewParams,
  CreateReviewResponse,
  SearchMyReviewInput,
  SearchMyReviewResponse,
  searchMyReviewValidSortKeys,
} from './review.validation';

/**
 * ============================================================================
 * @name    me_011_c
 * @desc    Create a review for a completed class session.
 *
 * ============================================================================
 */
export async function createReview(
  params: CreateReviewParams,
  input: CreateReviewInput,
  user: UserPayload
): Promise<CreateReviewResponse> {
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
      throw new ApiError(404, 'me_011_c_s_01', 'Class session not found or inactive.');
    }

    if (sessionRow.status !== sessionStatusType.COMPLETED) {
      throw new ApiError(400, 'me_011_c_s_02', 'Only completed sessions can be reviewed.');
    }

    const isStudentReviewer = sessionRow.studentUserId === user.userId;
    const isTutorReviewer = sessionRow.tutorUserId === user.userId;
    if (!isStudentReviewer && !isTutorReviewer) {
      throw new ApiError(403, 'me_011_c_s_03', 'You are not a participant of this class session.');
    }

    const existingReview = await trx('Review')
      .where({
        classSessionId: sessionRow.classSessionId,
        reviewerUserId: user.userId,
        isActiveFlag: true,
      })
      .first<Review>();
    if (existingReview) {
      throw new ApiError(409, 'me_011_c_s_04', 'You have already reviewed this session.');
    }

    // Prepare data
    const newReviewData: Partial<Review> = {
      classSessionId: sessionRow.classSessionId,
      reviewerUserId: user.userId,
      revieweeUserId: isStudentReviewer ? sessionRow.tutorUserId : sessionRow.studentUserId,
      tutorProfileId: sessionRow.tutorProfileId,
      reviewType: isStudentReviewer ? reviewType.STUDENT_TO_TUTOR : reviewType.TUTOR_TO_STUDENT,
      ratingScore: input.ratingScore,
      comment: input.comment || null,
      isPublishedFlag: true,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdReview] = await trx('Review').insert(newReviewData).returning<Review[]>('*');
    if (!createdReview) {
      throw new ApiError(500, 'me_011_c_s_05', 'Failed to create review.');
    }

    if (isStudentReviewer) {
      const stats = await trx('Review')
        .select(
          trx.raw('COALESCE(AVG("ratingScore"), 0) as "avgRating"'),
          trx.raw('COUNT("reviewId") as "reviewCount"')
        )
        .where({
          tutorProfileId: sessionRow.tutorProfileId,
          reviewType: reviewType.STUDENT_TO_TUTOR,
          isPublishedFlag: true,
          isActiveFlag: true,
        })
        .first<any>();

      const avg = Number(stats?.avgRating || input.ratingScore);
      const count = parseInt(stats?.reviewCount || '1', 10);
      const popularityScore = Number((avg * Math.log1p(count)).toFixed(4));

      await trx('TutorProfile')
        .where({ tutorProfileId: sessionRow.tutorProfileId })
        .update({
          popularityScore,
          ...auditUpdate(user.userLogName),
        });
    }

    // Return result
    return {
      reviewId: createdReview.reviewId,
      classSessionId: createdReview.classSessionId,
      ratingScore: Number(createdReview.ratingScore),
      comment: createdReview.comment || null,
      createdAt: new Date(createdReview.createdAt).toISOString(),
    };
  });
}

/**
 * ============================================================================
 * @name    me_011_s
 * @desc    Search reviews written by the authenticated user.
 *
 * ============================================================================
 */
export async function searchMyReview(
  input: SearchMyReviewInput,
  user: UserPayload
): Promise<SearchMyReviewResponse> {
  // Build query
  let query = db('Review')
    .select(
      'reviewId',
      'classSessionId',
      'tutorProfileId',
      'reviewType',
      'ratingScore',
      'comment',
      'isPublishedFlag',
      'createdAt'
    )
    .where({
      reviewerUserId: user.userId,
      isActiveFlag: true,
    });

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchMyReviewValidSortKeys,
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
  const reviews: Review[] = await query;

  // Return result
  const returnResult: SearchMyReviewResponse = {
    total: totalCount,
    pagination,
    data: reviews.map((rev) => ({
      reviewId: rev.reviewId,
      classSessionId: rev.classSessionId,
      tutorProfileId: rev.tutorProfileId || null,
      reviewType: rev.reviewType,
      ratingScore: Number(rev.ratingScore),
      comment: rev.comment || null,
      isPublishedFlag: rev.isPublishedFlag,
      createdAt: new Date(rev.createdAt).toISOString(),
    })),
  };
  return returnResult;
}
