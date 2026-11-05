import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditCreate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { StudentJob, UserActivityLog } from '@/types/db';
import { jobStatusType } from '@/constants/marketplace.constants';
import {
  GetPublicJobParams,
  GetPublicJobResponse,
  SearchPublicJobInput,
  SearchPublicJobResponse,
  searchPublicJobValidSortKeys,
  SharePublicJobParams,
  SharePublicJobResponse,
} from './job.validation';

/**
 * ============================================================================
 * @name    pub_003_s
 * @desc    Search open student job postings in the public marketplace.
 *
 * ============================================================================
 */
export async function searchPublicJob(input: SearchPublicJobInput): Promise<SearchPublicJobResponse> {
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
      'StudentJob.frequencyPerWeek as frequencyPerWeek',
      'StudentJob.status as status',
      'StudentJob.createdAt as createdAt'
    )
    .where({
      'StudentJob.status': jobStatusType.OPEN,
      'StudentJob.isActiveFlag': true,
      'Subject.isActiveFlag': true,
    });

  // Apply filters
  if (input.subjectId) {
    query = query.where('StudentJob.subjectId', input.subjectId);
  }
  if (input.locationType) {
    query = query.where('StudentJob.locationType', input.locationType);
  }
  if (input.budgetMin !== undefined) {
    query = query.where('StudentJob.budgetMax', '>=', input.budgetMin);
  }
  if (input.budgetMax !== undefined) {
    query = query.where('StudentJob.budgetMin', '<=', input.budgetMax);
  }
  if (input.targetGradeLevel) {
    query = query.where('StudentJob.targetGradeLevel', input.targetGradeLevel);
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchPublicJobValidSortKeys,
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
  const returnResult: SearchPublicJobResponse = {
    total: totalCount,
    pagination,
    data: rows.map((row: any) => ({
      studentJobId: row.studentJobId,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      targetGradeLevel: row.targetGradeLevel || null,
      topics: row.topics || [],
      learningGoal: row.learningGoal || null,
      budgetMin: row.budgetMin != null ? Number(row.budgetMin) : null,
      budgetMax: row.budgetMax != null ? Number(row.budgetMax) : null,
      locationType: row.locationType,
      frequencyPerWeek: row.frequencyPerWeek ?? null,
      status: row.status,
      createdAt: new Date(row.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    pub_003_g
 * @desc    Retrieve public details of a student job posting.
 *
 * ============================================================================
 */
export async function getPublicJob(params: GetPublicJobParams): Promise<GetPublicJobResponse> {
  // Check existing data
  const row = await db('StudentJob')
    .join('Subject', 'StudentJob.subjectId', 'Subject.subjectId')
    .join('StudentProfile', 'StudentJob.studentProfileId', 'StudentProfile.studentProfileId')
    .join('User', 'StudentProfile.userId', 'User.userId')
    .select(
      'StudentJob.studentJobId as studentJobId',
      'StudentJob.studentProfileId as studentProfileId',
      'User.displayName as studentDisplayName',
      'StudentJob.subjectId as subjectId',
      'Subject.name as subjectName',
      'StudentJob.targetGradeLevel as targetGradeLevel',
      'StudentJob.topics as topics',
      'StudentJob.learningGoal as learningGoal',
      'StudentJob.budgetMin as budgetMin',
      'StudentJob.budgetMax as budgetMax',
      'StudentJob.locationType as locationType',
      'StudentJob.frequencyPerWeek as frequencyPerWeek',
      'StudentJob.preferredDays as preferredDays',
      'StudentJob.status as status',
      'StudentJob.expiredAt as expiredAt',
      'StudentJob.createdAt as createdAt'
    )
    .where({
      'StudentJob.studentJobId': params.jobId,
      'StudentJob.isActiveFlag': true,
    })
    .first<any>();

  if (!row) {
    throw new ApiError(404, 'pub_003_g_s_01', 'Student job not found or inactive.');
  }

  const shareCountRow = await db('UserActivityLog')
    .where({
      entityType: 'StudentJobShare',
      entityId: row.studentJobId,
      isActiveFlag: true,
    })
    .count()
    .first<{ count: string }>();

  // Return result
  return {
    studentJobId: row.studentJobId,
    studentProfileId: row.studentProfileId,
    studentDisplayName: row.studentDisplayName,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    targetGradeLevel: row.targetGradeLevel || null,
    topics: row.topics || [],
    learningGoal: row.learningGoal || null,
    budgetMin: row.budgetMin != null ? Number(row.budgetMin) : null,
    budgetMax: row.budgetMax != null ? Number(row.budgetMax) : null,
    locationType: row.locationType,
    frequencyPerWeek: row.frequencyPerWeek ?? null,
    preferredDays: row.preferredDays ?? null,
    status: row.status,
    expiredAt: row.expiredAt ? new Date(row.expiredAt).toISOString() : null,
    shareCount: parseInt(shareCountRow?.count || '0', 10),
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/**
 * ============================================================================
 * @name    pub_003_share
 * @desc    Increment the share counter of a student job posting.
 *
 * ============================================================================
 */
export async function sharePublicJob(params: SharePublicJobParams): Promise<SharePublicJobResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingJob = await trx('StudentJob')
      .where({ studentJobId: params.jobId, isActiveFlag: true })
      .first<StudentJob>();
    if (!existingJob) {
      throw new ApiError(404, 'pub_003_share_s_01', 'Student job not found or inactive.');
    }

    // Insert data
    const newShareLog: Partial<UserActivityLog> = {
      actionType: 'create',
      entityType: 'StudentJobShare',
      entityId: existingJob.studentJobId,
      ...auditCreate('system'),
    };
    await trx('UserActivityLog').insert(newShareLog);

    const shareCountRow = await trx('UserActivityLog')
      .where({
        entityType: 'StudentJobShare',
        entityId: existingJob.studentJobId,
        isActiveFlag: true,
      })
      .count()
      .first<{ count: string }>();

    // Return result
    return {
      studentJobId: existingJob.studentJobId,
      shareCount: parseInt(shareCountRow?.count || '0', 10),
    };
  });
}
