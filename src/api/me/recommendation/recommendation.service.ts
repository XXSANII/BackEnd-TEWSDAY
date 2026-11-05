import { appConfig } from '@/config/app.config';
import { applyPagination } from '@/utils/data/applyPagination.helper';
import { auditCreate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { RecommendationFeedback, StudentJob, TutorProfile } from '@/types/db';
import { UserPayload } from '@/types/express';
import {
  jobStatusType,
  recommendationActionType,
  recommendationTargetType,
  teachingLocationType,
  verificationStatusType,
} from '@/constants/marketplace.constants';
import { userStatusType } from '@/constants/user.constants';
import {
  CreateRecommendationFeedbackInput,
  CreateRecommendationFeedbackResponse,
  SearchRecommendedJobInput,
  SearchRecommendedJobResponse,
  SearchRecommendedTutorInput,
  SearchRecommendedTutorResponse,
} from './recommendation.validation';

/**
 * ============================================================================
 * @name    me_008_tutors_s
 * @desc    Search AI-recommended tutors using hybrid scoring and feedback filtering.
 *
 * ============================================================================
 */
export async function searchRecommendedTutor(
  input: SearchRecommendedTutorInput,
  user: UserPayload
): Promise<SearchRecommendedTutorResponse> {
  // Prepare data
  let effectiveSubjectId = input.subjectId;
  let effectiveBudgetMax = input.budgetMax;
  let effectiveLocationType = input.teachingLocationType;

  if (input.studentJobId) {
    const jobRow = await db('StudentJob')
      .where({ studentJobId: input.studentJobId, isActiveFlag: true })
      .first<StudentJob>();
    if (jobRow) {
      effectiveSubjectId = effectiveSubjectId || jobRow.subjectId;
      if (effectiveBudgetMax === undefined && jobRow.budgetMax != null) {
        effectiveBudgetMax = Number(jobRow.budgetMax);
      }
      effectiveLocationType = effectiveLocationType || jobRow.locationType;
    }
  }

  const declinedRows = await db('RecommendationFeedback')
    .select('targetId')
    .where({
      actorUserId: user.userId,
      targetType: recommendationTargetType.TUTOR_PROFILE,
      action: recommendationActionType.DECLINED,
      isActiveFlag: true,
    });
  const declinedIds = declinedRows.map((r: any) => r.targetId);

  // Build query
  let query = db('TutorProfile')
    .join('User', 'TutorProfile.userId', 'User.userId')
    .select(
      'TutorProfile.tutorProfileId as tutorProfileId',
      'TutorProfile.userId as userId',
      'User.displayName as displayName',
      'User.profileImageId as profileImageId',
      'TutorProfile.bio as bio',
      'TutorProfile.hourlyRate as hourlyRate',
      'TutorProfile.teachingLocationType as teachingLocationType',
      'TutorProfile.verificationStatus as verificationStatus',
      'TutorProfile.popularityScore as popularityScore'
    )
    .where({
      'TutorProfile.isActiveFlag': true,
      'User.isActiveFlag': true,
    })
    .whereNotIn('User.status', [userStatusType.BANNED, userStatusType.SUSPENDED])
    .andWhereNot('TutorProfile.userId', user.userId);

  // Apply filters
  if (declinedIds.length > 0) {
    query = query.whereNotIn('TutorProfile.tutorProfileId', declinedIds);
  }
  if (effectiveSubjectId) {
    query = query.whereExists(function () {
      this.select(db.raw('1'))
        .from('TutorSubject')
        .whereRaw('"TutorSubject"."tutorProfileId" = "TutorProfile"."tutorProfileId"')
        .andWhere({
          'TutorSubject.subjectId': effectiveSubjectId,
          'TutorSubject.isActiveFlag': true,
        });
    });
  }
  if (effectiveLocationType) {
    if (effectiveLocationType === teachingLocationType.ONLINE) {
      query = query.whereIn('TutorProfile.teachingLocationType', [
        teachingLocationType.ONLINE,
        teachingLocationType.BOTH,
      ]);
    } else if (effectiveLocationType === teachingLocationType.ONSITE) {
      query = query.whereIn('TutorProfile.teachingLocationType', [
        teachingLocationType.ONSITE,
        teachingLocationType.BOTH,
      ]);
    }
  }

  // Apply sorting
  query = query.orderBy([
    { column: 'TutorProfile.popularityScore', order: 'desc' },
    { column: 'TutorProfile.createdAt', order: 'desc' },
  ]);

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

  // Format return data
  const weights = appConfig.matching.RANK_WEIGHT;
  const formattedTutors = rows.map((row: any) => {
    const rate = row.hourlyRate != null ? Number(row.hourlyRate) : null;
    const rateFitScore =
      effectiveBudgetMax != null && rate != null
        ? rate <= effectiveBudgetMax
          ? 1.0
          : Math.max(0, 1 - (rate - effectiveBudgetMax) / Math.max(effectiveBudgetMax, 1))
        : 0.8;
    const verifiedScore = row.verificationStatus === verificationStatusType.VERIFIED ? 1.0 : 0.5;
    const popNormalized = Math.min(1.0, Math.log1p(Number(row.popularityScore || 0)) / 5);
    const hybridScore = Number(
      (
        weights.semantic * 0.85 +
        weights.lexical * 0.8 +
        weights.availability * 0.8 +
        weights.distanceRateFit * rateFitScore +
        weights.qualitySignals * ((verifiedScore + popNormalized) / 2)
      ).toFixed(4)
    );

    return {
      tutorProfileId: row.tutorProfileId,
      userId: row.userId,
      displayName: row.displayName,
      profileImageId: row.profileImageId || null,
      bio: row.bio || null,
      hourlyRate: rate,
      teachingLocationType: row.teachingLocationType,
      verificationStatus: row.verificationStatus,
      popularityScore: Number(row.popularityScore || 0),
      matchScore: hybridScore,
    };
  });

  formattedTutors.sort((a, b) => b.matchScore - a.matchScore);

  // Return result
  const returnResult: SearchRecommendedTutorResponse = {
    total: totalCount,
    pagination,
    data: formattedTutors,
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_008_jobs_s
 * @desc    Search AI-recommended student jobs for the authenticated tutor.
 *
 * ============================================================================
 */
export async function searchRecommendedJob(
  input: SearchRecommendedJobInput,
  user: UserPayload
): Promise<SearchRecommendedJobResponse> {
  // Prepare data
  const tutorProfile = await db('TutorProfile')
    .where({ userId: user.userId, isActiveFlag: true })
    .first<TutorProfile>();

  let tutorSubjectIds: string[] = [];
  if (tutorProfile) {
    const subRows = await db('TutorSubject')
      .select('subjectId')
      .where({ tutorProfileId: tutorProfile.tutorProfileId, isActiveFlag: true });
    tutorSubjectIds = subRows.map((r: any) => r.subjectId);
  }

  const declinedRows = await db('RecommendationFeedback')
    .select('targetId')
    .where({
      actorUserId: user.userId,
      targetType: recommendationTargetType.STUDENT_JOB,
      action: recommendationActionType.DECLINED,
      isActiveFlag: true,
    });
  const declinedJobIds = declinedRows.map((r: any) => r.targetId);

  // Build query
  let query = db('StudentJob')
    .join('Subject', 'StudentJob.subjectId', 'Subject.subjectId')
    .select(
      'StudentJob.studentJobId as studentJobId',
      'StudentJob.subjectId as subjectId',
      'Subject.name as subjectName',
      'StudentJob.targetGradeLevel as targetGradeLevel',
      'StudentJob.topics as topics',
      'StudentJob.learningGoal as learningGoal',
      'StudentJob.budgetMin as budgetMin',
      'StudentJob.budgetMax as budgetMax',
      'StudentJob.locationType as locationType',
      'StudentJob.status as status',
      'StudentJob.createdAt as createdAt'
    )
    .where({
      'StudentJob.status': jobStatusType.OPEN,
      'StudentJob.isActiveFlag': true,
      'Subject.isActiveFlag': true,
    });

  // Apply filters
  if (declinedJobIds.length > 0) {
    query = query.whereNotIn('StudentJob.studentJobId', declinedJobIds);
  }
  if (input.subjectId) {
    query = query.where('StudentJob.subjectId', input.subjectId);
  } else if (tutorSubjectIds.length > 0) {
    query = query.whereIn('StudentJob.subjectId', tutorSubjectIds);
  }
  if (input.locationType) {
    query = query.where('StudentJob.locationType', input.locationType);
  }

  // Apply sorting
  query = query.orderBy('StudentJob.createdAt', 'desc');

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

  // Format return data
  const tutorRate = tutorProfile?.hourlyRate != null ? Number(tutorProfile.hourlyRate) : null;
  const formattedJobs = rows.map((row: any) => {
    const subjectMatched = tutorSubjectIds.includes(row.subjectId) ? 1.0 : 0.7;
    const budgetMax = row.budgetMax != null ? Number(row.budgetMax) : null;
    const rateFit =
      tutorRate != null && budgetMax != null
        ? tutorRate <= budgetMax
          ? 1.0
          : Math.max(0.3, 1 - (tutorRate - budgetMax) / Math.max(budgetMax, 1))
        : 0.85;
    const matchScore = Number((subjectMatched * 0.6 + rateFit * 0.4).toFixed(4));

    return {
      studentJobId: row.studentJobId,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      targetGradeLevel: row.targetGradeLevel || null,
      topics: row.topics || [],
      learningGoal: row.learningGoal || null,
      budgetMin: row.budgetMin != null ? Number(row.budgetMin) : null,
      budgetMax,
      locationType: row.locationType,
      status: row.status,
      matchScore,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  });

  // Return result
  const returnResult: SearchRecommendedJobResponse = {
    total: totalCount,
    pagination,
    data: formattedJobs,
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_008_feedback_c
 * @desc    Record user feedback on an AI recommendation.
 *
 * ============================================================================
 */
export async function createRecommendationFeedback(
  input: CreateRecommendationFeedbackInput,
  user: UserPayload
): Promise<CreateRecommendationFeedbackResponse> {
  return db.transaction(async (trx) => {
    // Prepare data
    const newFeedbackData: Partial<RecommendationFeedback> = {
      actorUserId: user.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      action: input.action,
      declineReason: input.declineReason || null,
      rankingVersion: input.rankingVersion || 'v1.0-hybrid',
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdFeedback] = await trx('RecommendationFeedback')
      .insert(newFeedbackData)
      .returning<RecommendationFeedback[]>('*');
    if (!createdFeedback) {
      throw new ApiError(500, 'me_008_feedback_c_s_01', 'Failed to record recommendation feedback.');
    }

    // Return result
    return {
      recommendationFeedbackId: createdFeedback.recommendationFeedbackId,
      targetType: createdFeedback.targetType,
      targetId: createdFeedback.targetId,
      action: createdFeedback.action,
    };
  });
}
