import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { TutorAvailability, TutorEducation, TutorProfile } from '@/types/db';
import { teachingLocationType, verificationStatusType } from '@/constants/marketplace.constants';
import { userStatusType } from '@/constants/user.constants';
import {
  GetPublicTutorAvailabilityParams,
  GetPublicTutorAvailabilityResponse,
  GetTutorParams,
  GetTutorResponse,
  SearchTutorInput,
  SearchTutorResponse,
  SearchTutorReviewInput,
  SearchTutorReviewParams,
  SearchTutorReviewResponse,
  searchTutorReviewValidSortKeys,
  searchTutorValidSortKeys,
} from './tutor.validation';

/**
 * ============================================================================
 * @name    pub_002_s
 * @desc    Search public tutor profiles with subject, rate, and PostGIS radius filters.
 *
 * ============================================================================
 */
export async function searchTutor(input: SearchTutorInput): Promise<SearchTutorResponse> {
  // Build query
  const hasGeoFilter =
    input.latitude !== undefined && input.longitude !== undefined && input.radiusKm !== undefined;

  let query = db('TutorProfile')
    .join('User', 'TutorProfile.userId', 'User.userId')
    .where({
      'TutorProfile.isActiveFlag': true,
      'User.isActiveFlag': true,
    })
    .whereNotIn('User.status', [userStatusType.BANNED, userStatusType.SUSPENDED])
    .select(
      'TutorProfile.tutorProfileId as tutorProfileId',
      'TutorProfile.userId as userId',
      'User.displayName as displayName',
      'User.profileImageId as profileImageId',
      'TutorProfile.bio as bio',
      'TutorProfile.hourlyRate as hourlyRate',
      'TutorProfile.teachingLocationType as teachingLocationType',
      'TutorProfile.verificationStatus as verificationStatus',
      'TutorProfile.popularityScore as popularityScore',
      'TutorProfile.createdAt as createdAt'
    );

  if (hasGeoFilter && input.longitude !== undefined && input.latitude !== undefined) {
    query = query.select(
      db.raw(
        'CASE WHEN "TutorProfile"."location" IS NOT NULL THEN ST_Distance("TutorProfile"."location"::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) / 1000.0 ELSE NULL END as "distanceKm"',
        [input.longitude, input.latitude]
      )
    );
  }

  // Apply filters
  if (input.verifiedOnlyFlag) {
    query = query.where('TutorProfile.verificationStatus', verificationStatusType.VERIFIED);
  }
  if (input.keyword) {
    query = query.andWhere((qb) => {
      qb.where('User.displayName', 'ilike', `%${input.keyword}%`).orWhere(
        'TutorProfile.bio',
        'ilike',
        `%${input.keyword}%`
      );
    });
  }
  if (input.subjectId) {
    query = query.whereExists(function () {
      this.select(db.raw('1'))
        .from('TutorSubject')
        .whereRaw('"TutorSubject"."tutorProfileId" = "TutorProfile"."tutorProfileId"')
        .andWhere({
          'TutorSubject.subjectId': input.subjectId,
          'TutorSubject.isActiveFlag': true,
        });
    });
  }
  if (input.teachingLocationType) {
    if (input.teachingLocationType === teachingLocationType.ONLINE) {
      query = query.whereIn('TutorProfile.teachingLocationType', [
        teachingLocationType.ONLINE,
        teachingLocationType.BOTH,
      ]);
    } else if (input.teachingLocationType === teachingLocationType.ONSITE) {
      query = query.whereIn('TutorProfile.teachingLocationType', [
        teachingLocationType.ONSITE,
        teachingLocationType.BOTH,
      ]);
    } else {
      query = query.where('TutorProfile.teachingLocationType', input.teachingLocationType);
    }
  }
  if (input.minHourlyRate !== undefined) {
    query = query.where('TutorProfile.hourlyRate', '>=', input.minHourlyRate);
  }
  if (input.maxHourlyRate !== undefined) {
    query = query.where('TutorProfile.hourlyRate', '<=', input.maxHourlyRate);
  }
  if (hasGeoFilter && input.longitude !== undefined && input.latitude !== undefined) {
    const radiusMeters = (input.radiusKm || 10) * 1000;
    query = query.whereRaw(
      '("TutorProfile"."location" IS NOT NULL AND ST_DWithin("TutorProfile"."location"::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?))',
      [input.longitude, input.latitude, radiusMeters]
    );
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchTutorValidSortKeys,
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
  const tutorIds = rows.map((r: any) => r.tutorProfileId);

  const ratingMap = new Map<string, { avg: number; count: number }>();
  if (tutorIds.length > 0) {
    const ratingStats = await db('Review')
      .select(
        'tutorProfileId',
        db.raw('COALESCE(AVG("ratingScore"), 0) as "averageRating"'),
        db.raw('COUNT("reviewId") as "reviewCount"')
      )
      .whereIn('tutorProfileId', tutorIds)
      .andWhere({ isPublishedFlag: true, isActiveFlag: true })
      .groupBy('tutorProfileId');

    for (const stat of ratingStats as any[]) {
      ratingMap.set(stat.tutorProfileId, {
        avg: Number(Number(stat.averageRating).toFixed(2)),
        count: parseInt(stat.reviewCount || '0', 10),
      });
    }
  }

  // Format return data
  const formattedTutors = rows.map((row: any) => {
    const stat = ratingMap.get(row.tutorProfileId) || { avg: 0, count: 0 };
    return {
      tutorProfileId: row.tutorProfileId,
      userId: row.userId,
      displayName: row.displayName,
      profileImageId: row.profileImageId || null,
      bio: row.bio || null,
      hourlyRate: row.hourlyRate != null ? Number(row.hourlyRate) : null,
      teachingLocationType: row.teachingLocationType,
      verificationStatus: row.verificationStatus,
      popularityScore: Number(row.popularityScore || 0),
      averageRating: stat.avg,
      reviewCount: stat.count,
      distanceKm: row.distanceKm != null ? Number(Number(row.distanceKm).toFixed(2)) : null,
    };
  });

  // Return result
  const returnResult: SearchTutorResponse = {
    total: totalCount,
    pagination,
    data: formattedTutors,
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    pub_002_g
 * @desc    Retrieve public details, subjects, educations, and rating summary of a tutor.
 *
 * ============================================================================
 */
export async function getTutor(params: GetTutorParams): Promise<GetTutorResponse> {
  // Check existing data
  const row = await db('TutorProfile')
    .join('User', 'TutorProfile.userId', 'User.userId')
    .select(
      'TutorProfile.tutorProfileId as tutorProfileId',
      'TutorProfile.userId as userId',
      'User.displayName as displayName',
      'User.profileImageId as profileImageId',
      'TutorProfile.bio as bio',
      'TutorProfile.hourlyRate as hourlyRate',
      'TutorProfile.teachingLocationType as teachingLocationType',
      'TutorProfile.serviceRadiusKm as serviceRadiusKm',
      'TutorProfile.introVideoFileId as introVideoFileId',
      'TutorProfile.verificationStatus as verificationStatus',
      'TutorProfile.popularityScore as popularityScore'
    )
    .where({
      'TutorProfile.tutorProfileId': params.tutorId,
      'TutorProfile.isActiveFlag': true,
      'User.isActiveFlag': true,
    })
    .first<any>();

  if (!row) {
    throw new ApiError(404, 'pub_002_g_s_01', 'Tutor profile not found or inactive.');
  }

  // Build query
  const subjects = await db('TutorSubject')
    .join('Subject', 'TutorSubject.subjectId', 'Subject.subjectId')
    .select(
      'TutorSubject.tutorSubjectId as tutorSubjectId',
      'TutorSubject.subjectId as subjectId',
      'Subject.name as subjectName',
      'Subject.category as category',
      'TutorSubject.proficiencyLevel as proficiencyLevel',
      'TutorSubject.gradeLevels as gradeLevels',
      'TutorSubject.specializedTopics as specializedTopics',
      'TutorSubject.customHourlyRate as customHourlyRate'
    )
    .where({
      'TutorSubject.tutorProfileId': row.tutorProfileId,
      'TutorSubject.isActiveFlag': true,
      'Subject.isActiveFlag': true,
    });

  const educations = await db('TutorEducation')
    .select('tutorEducationId', 'institution', 'degree', 'fieldOfStudy', 'graduationYear', 'isVerifiedFlag')
    .where({
      tutorProfileId: row.tutorProfileId,
      isActiveFlag: true,
    })
    .orderBy('graduationYear', 'desc');

  const ratingStat = await db('Review')
    .select(
      db.raw('COALESCE(AVG("ratingScore"), 0) as "averageRating"'),
      db.raw('COUNT("reviewId") as "reviewCount"')
    )
    .where({
      tutorProfileId: row.tutorProfileId,
      isPublishedFlag: true,
      isActiveFlag: true,
    })
    .first<any>();

  // Return result
  return {
    tutorProfileId: row.tutorProfileId,
    userId: row.userId,
    displayName: row.displayName,
    profileImageId: row.profileImageId || null,
    bio: row.bio || null,
    hourlyRate: row.hourlyRate != null ? Number(row.hourlyRate) : null,
    teachingLocationType: row.teachingLocationType,
    serviceRadiusKm: row.serviceRadiusKm != null ? Number(row.serviceRadiusKm) : null,
    introVideoFileId: row.introVideoFileId || null,
    verificationStatus: row.verificationStatus,
    popularityScore: Number(row.popularityScore || 0),
    averageRating: Number(Number(ratingStat?.averageRating || 0).toFixed(2)),
    reviewCount: parseInt(ratingStat?.reviewCount || '0', 10),
    subjects: subjects.map((sub: any) => ({
      tutorSubjectId: sub.tutorSubjectId,
      subjectId: sub.subjectId,
      subjectName: sub.subjectName,
      category: sub.category,
      proficiencyLevel: sub.proficiencyLevel || null,
      gradeLevels: sub.gradeLevels || [],
      specializedTopics: sub.specializedTopics || [],
      customHourlyRate: sub.customHourlyRate != null ? Number(sub.customHourlyRate) : null,
    })),
    educations: educations.map((edu: TutorEducation) => ({
      tutorEducationId: edu.tutorEducationId,
      institution: edu.institution,
      degree: edu.degree || null,
      fieldOfStudy: edu.fieldOfStudy || null,
      graduationYear: edu.graduationYear ?? null,
      isVerifiedFlag: edu.isVerifiedFlag,
    })),
  };
}

/**
 * ============================================================================
 * @name    pub_002_avail_g
 * @desc    Retrieve public availability slots of a tutor.
 *
 * ============================================================================
 */
export async function getPublicTutorAvailability(
  params: GetPublicTutorAvailabilityParams
): Promise<GetPublicTutorAvailabilityResponse> {
  // Check existing data
  const existingTutor = await db('TutorProfile')
    .where({ tutorProfileId: params.tutorId, isActiveFlag: true })
    .first<TutorProfile>();
  if (!existingTutor) {
    throw new ApiError(404, 'pub_002_avail_g_s_01', 'Tutor profile not found or inactive.');
  }

  // Build query
  const slots = await db('TutorAvailability')
    .select('tutorAvailabilityId', 'dayOfWeek', 'specificDate', 'startTime', 'endTime', 'isAvailableFlag')
    .where({
      tutorProfileId: existingTutor.tutorProfileId,
      isActiveFlag: true,
    })
    .orderBy([
      { column: 'dayOfWeek', order: 'asc' },
      { column: 'specificDate', order: 'asc' },
      { column: 'startTime', order: 'asc' },
    ]);

  // Return result
  return {
    tutorProfileId: existingTutor.tutorProfileId,
    slots: slots.map((slot: TutorAvailability) => ({
      tutorAvailabilityId: slot.tutorAvailabilityId,
      dayOfWeek: slot.dayOfWeek ?? null,
      specificDate: slot.specificDate ? String(slot.specificDate).slice(0, 10) : null,
      startTime: String(slot.startTime).slice(0, 5),
      endTime: String(slot.endTime).slice(0, 5),
      isAvailableFlag: slot.isAvailableFlag,
    })),
  };
}

/**
 * ============================================================================
 * @name    pub_002_rev_s
 * @desc    Search published reviews of a tutor.
 *
 * ============================================================================
 */
export async function searchTutorReview(
  params: SearchTutorReviewParams,
  input: SearchTutorReviewInput
): Promise<SearchTutorReviewResponse> {
  // Check existing data
  const existingTutor = await db('TutorProfile')
    .where({ tutorProfileId: params.tutorId, isActiveFlag: true })
    .first<TutorProfile>();
  if (!existingTutor) {
    throw new ApiError(404, 'pub_002_rev_s_s_01', 'Tutor profile not found or inactive.');
  }

  // Build query
  let query = db('Review')
    .join('User', 'Review.reviewerUserId', 'User.userId')
    .select(
      'Review.reviewId as reviewId',
      'User.displayName as reviewerDisplayName',
      'Review.ratingScore as ratingScore',
      'Review.comment as comment',
      'Review.createdAt as createdAt'
    )
    .where({
      'Review.tutorProfileId': existingTutor.tutorProfileId,
      'Review.isPublishedFlag': true,
      'Review.isActiveFlag': true,
    });

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchTutorReviewValidSortKeys,
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
  const reviews = await query;

  // Return result
  const returnResult: SearchTutorReviewResponse = {
    total: totalCount,
    pagination,
    data: reviews.map((rev: any) => ({
      reviewId: rev.reviewId,
      reviewerDisplayName: rev.reviewerDisplayName,
      ratingScore: Number(rev.ratingScore),
      comment: rev.comment || null,
      createdAt: new Date(rev.createdAt).toISOString(),
    })),
  };
  return returnResult;
}
