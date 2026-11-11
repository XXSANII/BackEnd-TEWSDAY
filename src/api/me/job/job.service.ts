import { appConfig } from '@/config/app.config';
import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditCreate, auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { Booking, JobApplication, Notification, StudentJob, StudentProfile, Subject, TutorProfile } from '@/types/db';
import { UserPayload } from '@/types/express';
import {
  applicationStatusType,
  bookingStatusType,
  jobStatusType,
  notificationPriorityType,
  teachingLocationType,
  teachingModeType,
  verificationStatusType,
} from '@/constants/marketplace.constants';
import { userStatusType } from '@/constants/user.constants';
import {
  ApplyStudentJobInput,
  ApplyStudentJobParams,
  ApplyStudentJobResponse,
  CreateStudentJobInput,
  CreateStudentJobResponse,
  EditJobApplicationStatusInput,
  EditJobApplicationStatusParams,
  EditJobApplicationStatusResponse,
  EditStudentJobStatusInput,
  EditStudentJobStatusParams,
  EditStudentJobStatusResponse,
  SearchJobApplicationInput,
  SearchJobApplicationParams,
  SearchJobApplicationResponse,
  searchJobApplicationValidSortKeys,
} from './job.validation';

/**
 * ============================================================================
 * @name    me_005_c
 * @desc    Create a new student job posting.
 *
 * ============================================================================
 */
export async function createStudentJob(
  input: CreateStudentJobInput,
  user: UserPayload
): Promise<CreateStudentJobResponse> {
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
      throw new ApiError(500, 'me_005_c_s_01', 'Failed to resolve student profile.');
    }

    const existingSubject = await trx('Subject')
      .where({ subjectId: input.subjectId, isActiveFlag: true })
      .first<Subject>();
    if (!existingSubject) {
      throw new ApiError(404, 'me_005_c_s_02', 'Subject not found or inactive.');
    }

    // Prepare data
    const expiredAt = new Date(Date.now() + appConfig.job.EXPIRE_DAYS * 24 * 60 * 60 * 1000);
    const newJobData: Record<string, unknown> = {
      studentProfileId: studentProfile.studentProfileId,
      subjectId: input.subjectId,
      targetGradeLevel: input.targetGradeLevel || null,
      topics: input.topics || [],
      learningGoal: input.learningGoal || null,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      locationType: input.locationType,
      frequencyPerWeek: input.frequencyPerWeek ?? null,
      preferredDays: input.preferredDays ?? null,
      status: jobStatusType.OPEN,
      expiredAt,
      ...auditCreate(user.userLogName),
    };

    if (input.latitude != null && input.longitude != null) {
      newJobData.location = trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [input.longitude, input.latitude]);
    }

    // Insert data
    const [createdJob] = await trx('StudentJob').insert(newJobData).returning<StudentJob[]>('*');
    if (!createdJob) {
      throw new ApiError(500, 'me_005_c_s_03', 'Failed to create student job posting.');
    }

    // Return result
    return {
      studentJobId: createdJob.studentJobId,
      status: createdJob.status,
      expiredAt: createdJob.expiredAt ? new Date(createdJob.expiredAt).toISOString() : null,
    };
  });
}

/**
 * ============================================================================
 * @name    me_005_status_e
 * @desc    Update the status of a student job posting.
 *
 * ============================================================================
 */
export async function editStudentJobStatus(
  params: EditStudentJobStatusParams,
  input: EditStudentJobStatusInput,
  user: UserPayload
): Promise<EditStudentJobStatusResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const studentProfile = await trx('StudentProfile')
      .where({ userId: user.userId, isActiveFlag: true })
      .first<StudentProfile>();
    if (!studentProfile) {
      throw new ApiError(404, 'me_005_status_e_s_01', 'Student profile not found.');
    }

    const existingJob = await trx('StudentJob')
      .where({
        studentJobId: params.jobId,
        studentProfileId: studentProfile.studentProfileId,
        isActiveFlag: true,
      })
      .first<StudentJob>();
    if (!existingJob) {
      throw new ApiError(404, 'me_005_status_e_s_02', 'Student job not found or inactive.');
    }

    // Update data
    const [updatedJob] = await trx('StudentJob')
      .where({ studentJobId: existingJob.studentJobId })
      .update({
        status: input.status,
        ...auditUpdate(user.userLogName),
      })
      .returning<StudentJob[]>('*');
    if (!updatedJob) {
      throw new ApiError(500, 'me_005_status_e_s_03', 'Failed to update job status.');
    }

    // Return result
    return {
      studentJobId: updatedJob.studentJobId,
      status: updatedJob.status,
    };
  });
}

/**
 * ============================================================================
 * @name    me_005_apps_s
 * @desc    Search tutor applications submitted for a student job.
 *
 * ============================================================================
 */
export async function searchJobApplication(
  params: SearchJobApplicationParams,
  input: SearchJobApplicationInput,
  user: UserPayload
): Promise<SearchJobApplicationResponse> {
  // Check existing data
  const studentProfile = await db('StudentProfile')
    .where({ userId: user.userId, isActiveFlag: true })
    .first<StudentProfile>();
  if (!studentProfile) {
    throw new ApiError(404, 'me_005_apps_s_s_01', 'Student profile not found.');
  }

  const existingJob = await db('StudentJob')
    .where({
      studentJobId: params.jobId,
      studentProfileId: studentProfile.studentProfileId,
      isActiveFlag: true,
    })
    .first<StudentJob>();
  if (!existingJob) {
    throw new ApiError(404, 'me_005_apps_s_s_02', 'Student job not found or inactive.');
  }

  // Build query
  let query = db('JobApplication')
    .join('TutorProfile', 'JobApplication.tutorProfileId', 'TutorProfile.tutorProfileId')
    .join('User', 'TutorProfile.userId', 'User.userId')
    .select(
      'JobApplication.jobApplicationId as jobApplicationId',
      'JobApplication.studentJobId as studentJobId',
      'JobApplication.tutorProfileId as tutorProfileId',
      'User.displayName as tutorDisplayName',
      'User.profileImageId as tutorProfileImageId',
      'JobApplication.proposedRate as proposedRate',
      'JobApplication.proposedAvailability as proposedAvailability',
      'JobApplication.coverMessage as coverMessage',
      'JobApplication.status as status',
      'JobApplication.createdAt as createdAt'
    )
    .where({
      'JobApplication.studentJobId': existingJob.studentJobId,
      'JobApplication.isActiveFlag': true,
    });

  // Apply filters
  if (input.status) {
    query = query.where('JobApplication.status', input.status);
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchJobApplicationValidSortKeys,
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
  const returnResult: SearchJobApplicationResponse = {
    total: totalCount,
    pagination,
    data: rows.map((row: any) => ({
      jobApplicationId: row.jobApplicationId,
      studentJobId: row.studentJobId,
      tutorProfileId: row.tutorProfileId,
      tutorDisplayName: row.tutorDisplayName,
      tutorProfileImageId: row.tutorProfileImageId || null,
      proposedRate: Number(row.proposedRate),
      proposedAvailability: row.proposedAvailability ?? null,
      coverMessage: row.coverMessage || null,
      status: row.status,
      createdAt: new Date(row.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_005_apply_c
 * @desc    Submit a tutor application to an open student job.
 *
 * ============================================================================
 */
export async function applyStudentJob(
  params: ApplyStudentJobParams,
  input: ApplyStudentJobInput,
  user: UserPayload
): Promise<ApplyStudentJobResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const tutorProfile = await trx('TutorProfile')
      .where({ userId: user.userId, isActiveFlag: true })
      .first<TutorProfile>();
    if (!tutorProfile) {
      throw new ApiError(403, 'me_005_apply_c_s_01', 'Tutor profile is required to apply for jobs.');
    }

    if (user.status !== userStatusType.NORMAL) {
      throw new ApiError(403, 'me_005_apply_c_s_05', 'Your account status does not allow submitting job applications.');
    }

    if (tutorProfile.verificationStatus !== verificationStatusType.VERIFIED) {
      throw new ApiError(403, 'me_005_apply_c_s_06', 'Only verified tutors can apply for jobs.');
    }

    const existingJob = await trx('StudentJob')
      .where({ studentJobId: params.jobId, isActiveFlag: true })
      .first<StudentJob>();
    if (!existingJob || existingJob.status !== jobStatusType.OPEN) {
      throw new ApiError(404, 'me_005_apply_c_s_02', 'Open student job not found.');
    }

    const duplicateApp = await trx('JobApplication')
      .where({
        studentJobId: existingJob.studentJobId,
        tutorProfileId: tutorProfile.tutorProfileId,
        isActiveFlag: true,
      })
      .first<JobApplication>();
    if (duplicateApp) {
      throw new ApiError(409, 'me_005_apply_c_s_03', 'You have already applied to this job.');
    }

    // Prepare data
    const newAppData: Partial<JobApplication> = {
      studentJobId: existingJob.studentJobId,
      tutorProfileId: tutorProfile.tutorProfileId,
      proposedRate: input.proposedRate,
      proposedAvailability: input.proposedAvailability ?? null,
      coverMessage: input.coverMessage || null,
      status: applicationStatusType.PENDING,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdApp] = await trx('JobApplication').insert(newAppData).returning<JobApplication[]>('*');
    if (!createdApp) {
      throw new ApiError(500, 'me_005_apply_c_s_04', 'Failed to submit job application.');
    }

    const studentOwner = await trx('StudentProfile')
      .where({ studentProfileId: existingJob.studentProfileId, isActiveFlag: true })
      .first<StudentProfile>();
    if (studentOwner) {
      const notiData: Partial<Notification> = {
        userId: studentOwner.userId,
        priorityTier: notificationPriorityType.HIGH,
        title: 'New Tutor Application',
        body: `${user.displayName} submitted a proposal for your job posting.`,
        referenceType: 'JobApplication',
        referenceId: createdApp.jobApplicationId,
        isReadFlag: false,
        ...auditCreate(user.userLogName),
      };
      await trx('Notification').insert(notiData);
    }

    // Return result
    return {
      jobApplicationId: createdApp.jobApplicationId,
      studentJobId: createdApp.studentJobId,
      status: createdApp.status,
    };
  });
}

/**
 * ============================================================================
 * @name    me_005_app_status_e
 * @desc    Update the status of a tutor job application.
 *
 * ============================================================================
 */
export async function editJobApplicationStatus(
  params: EditJobApplicationStatusParams,
  input: EditJobApplicationStatusInput,
  user: UserPayload
): Promise<EditJobApplicationStatusResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    if (input.status !== applicationStatusType.ACCEPTED && input.status !== applicationStatusType.REJECTED) {
      throw new ApiError(400, 'me_005_app_status_e_s_05', 'Only accepted or rejected can be set on an application.');
    }

    const existingApp = await trx('JobApplication')
      .where({ jobApplicationId: params.applicationId, isActiveFlag: true })
      .forUpdate()
      .first<JobApplication>();
    if (!existingApp) {
      throw new ApiError(404, 'me_005_app_status_e_s_01', 'Job application not found or inactive.');
    }

    const existingJob = await trx('StudentJob')
      .where({ studentJobId: existingApp.studentJobId, isActiveFlag: true })
      .forUpdate()
      .first<StudentJob>();
    if (!existingJob) {
      throw new ApiError(404, 'me_005_app_status_e_s_02', 'Associated student job not found.');
    }

    const studentProfile = await trx('StudentProfile')
      .where({ userId: user.userId, isActiveFlag: true })
      .first<StudentProfile>();
    if (!studentProfile || studentProfile.studentProfileId !== existingJob.studentProfileId) {
      throw new ApiError(403, 'me_005_app_status_e_s_03', 'You are not authorized to manage this job application.');
    }

    // A repeated accept of the same application returns the booking it already created
    if (existingApp.status === applicationStatusType.ACCEPTED && input.status === applicationStatusType.ACCEPTED) {
      const existingBooking = await trx('Booking')
        .where({
          originatingStudentJobId: existingJob.studentJobId,
          tutorProfileId: existingApp.tutorProfileId,
          isActiveFlag: true,
        })
        .first<Booking>();
      return {
        jobApplicationId: existingApp.jobApplicationId,
        status: existingApp.status,
        bookingId: existingBooking?.bookingId ?? null,
      };
    }

    if (existingApp.status !== applicationStatusType.PENDING) {
      throw new ApiError(409, 'me_005_app_status_e_s_06', 'Job application is not pending.');
    }

    if (input.status === applicationStatusType.ACCEPTED && existingJob.status !== jobStatusType.OPEN) {
      throw new ApiError(409, 'me_005_app_status_e_s_07', 'Job is no longer open.');
    }

    // Update data
    const [updatedApp] = await trx('JobApplication')
      .where({ jobApplicationId: existingApp.jobApplicationId })
      .update({
        status: input.status,
        ...auditUpdate(user.userLogName),
      })
      .returning<JobApplication[]>('*');
    if (!updatedApp) {
      throw new ApiError(500, 'me_005_app_status_e_s_04', 'Failed to update job application status.');
    }

    const notiRows: Partial<Notification>[] = [];
    let bookingId: string | null = null;

    // -----------------------------------
    // Accept: reject other bids, match job, create booking
    // -----------------------------------
    if (input.status === applicationStatusType.ACCEPTED) {
      const otherPendingApps = await trx('JobApplication')
        .where({ studentJobId: existingJob.studentJobId, status: applicationStatusType.PENDING, isActiveFlag: true })
        .whereNot({ jobApplicationId: existingApp.jobApplicationId })
        .forUpdate()
        .select<JobApplication[]>('*');

      if (otherPendingApps.length > 0) {
        await trx('JobApplication')
          .whereIn(
            'jobApplicationId',
            otherPendingApps.map((app) => app.jobApplicationId)
          )
          .update({
            status: applicationStatusType.REJECTED,
            ...auditUpdate(user.userLogName),
          });
      }

      await trx('StudentJob')
        .where({ studentJobId: existingJob.studentJobId })
        .update({
          status: jobStatusType.MATCHED,
          ...auditUpdate(user.userLogName),
        });

      const newBookingData: Partial<Booking> = {
        studentProfileId: existingJob.studentProfileId,
        tutorProfileId: existingApp.tutorProfileId,
        subjectId: existingJob.subjectId,
        originatingStudentJobId: existingJob.studentJobId,
        agreedHourlyRate: existingApp.proposedRate,
        teachingMode:
          existingJob.locationType === teachingLocationType.ONSITE ? teachingModeType.ONSITE : teachingModeType.ONLINE,
        status: bookingStatusType.PENDING_CONFIRMATION,
        ...auditCreate(user.userLogName),
      };
      const [createdBooking] = await trx('Booking').insert(newBookingData).returning<Booking[]>('*');
      if (!createdBooking) {
        throw new ApiError(500, 'me_005_app_status_e_s_08', 'Failed to create booking.');
      }
      bookingId = createdBooking.bookingId;

      // Notify the rejected tutors
      if (otherPendingApps.length > 0) {
        const rejectedTutors = await trx('TutorProfile')
          .whereIn(
            'tutorProfileId',
            otherPendingApps.map((app) => app.tutorProfileId)
          )
          .select<TutorProfile[]>('userId', 'tutorProfileId');
        const appByTutor = new Map(otherPendingApps.map((app) => [app.tutorProfileId, app.jobApplicationId]));
        for (const rejectedTutor of rejectedTutors) {
          notiRows.push({
            userId: rejectedTutor.userId,
            priorityTier: notificationPriorityType.MEDIUM,
            title: 'Application REJECTED',
            body: 'Your job application was marked as rejected.',
            referenceType: 'JobApplication',
            referenceId: appByTutor.get(rejectedTutor.tutorProfileId),
            isReadFlag: false,
            ...auditCreate(user.userLogName),
          });
        }
      }
    }

    // Notify the tutor who owns this application
    const tutorOwner = await trx('TutorProfile')
      .where({ tutorProfileId: existingApp.tutorProfileId, isActiveFlag: true })
      .first<TutorProfile>();
    if (tutorOwner) {
      notiRows.push({
        userId: tutorOwner.userId,
        priorityTier: notificationPriorityType.HIGH,
        title: `Application ${input.status.toUpperCase()}`,
        body: `Your job application was marked as ${input.status}.`,
        referenceType: bookingId ? 'Booking' : 'JobApplication',
        referenceId: bookingId ?? updatedApp.jobApplicationId,
        isReadFlag: false,
        ...auditCreate(user.userLogName),
      });
    }
    if (notiRows.length > 0) {
      await trx('Notification').insert(notiRows);
    }

    // Return result
    return {
      jobApplicationId: updatedApp.jobApplicationId,
      status: updatedApp.status,
      bookingId,
    };
  });
}
