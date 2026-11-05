import { Knex } from 'knex';
import { getAuthRedisKey } from '@/utils/cache/getTemplateRedisKey.helper';
import { auditCreate, auditSoftDelete, auditUpdate } from '@/utils/data/auditFields.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { redis } from '@/utils/redis';
import {
  ProfileChangeRequest,
  TutorAvailability,
  TutorEducation,
  TutorProfile,
  TutorSubject,
} from '@/types/db';
import { UserPayload } from '@/types/express';
import {
  changeRequestStatusType,
  introVideoStatusType,
  teachingLocationType,
  verificationStatusType,
} from '@/constants/marketplace.constants';
import {
  CreateProfileChangeRequestInput,
  CreateProfileChangeRequestResponse,
  CreateTutorEducationInput,
  CreateTutorEducationResponse,
  DeleteTutorEducationParams,
  DeleteTutorEducationResponse,
  EditMyTutorProfileInput,
  EditMyTutorProfileResponse,
  EditTutorAvailabilityInput,
  EditTutorAvailabilityResponse,
  GetMyTutorProfileResponse,
  GetTutorAvailabilityResponse,
} from './tutor.validation';

async function getOrCreateTutorProfile(
  user: UserPayload,
  trxOrDb: Knex | Knex.Transaction
): Promise<TutorProfile & { latitude?: number | null; longitude?: number | null }> {
  let profile = await trxOrDb('TutorProfile')
    .select(
      'TutorProfile.*',
      trxOrDb.raw('ST_Y("location"::geometry) as "latitude"'),
      trxOrDb.raw('ST_X("location"::geometry) as "longitude"')
    )
    .where({ userId: user.userId, isActiveFlag: true })
    .first<TutorProfile & { latitude?: number | null; longitude?: number | null }>();

  if (!profile) {
    const newProfileData: Partial<TutorProfile> = {
      userId: user.userId,
      teachingLocationType: teachingLocationType.ONLINE,
      verificationStatus: verificationStatusType.UNVERIFIED,
      popularityScore: 0,
      ...auditCreate(user.userLogName),
    };
    const [created] = await trxOrDb('TutorProfile').insert(newProfileData).returning<TutorProfile[]>('*');
    if (!created) {
      throw new ApiError(500, 'me_003_g_s_01', 'Failed to initialize tutor profile.');
    }
    await redis.del(getAuthRedisKey(user.token));
    profile = { ...created, latitude: null, longitude: null };
  }

  return profile;
}

/**
 * ============================================================================
 * @name    me_003_g
 * @desc    Retrieve the tutor profile, subjects, and education of the authenticated user.
 *
 * ============================================================================
 */
export async function getMyTutorProfile(user: UserPayload): Promise<GetMyTutorProfileResponse> {
  // Check existing data
  const profile = await getOrCreateTutorProfile(user, db);

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
      'TutorSubject.tutorProfileId': profile.tutorProfileId,
      'TutorSubject.isActiveFlag': true,
      'Subject.isActiveFlag': true,
    });

  const educations = await db('TutorEducation')
    .select(
      'tutorEducationId',
      'institution',
      'degree',
      'fieldOfStudy',
      'graduationYear',
      'verificationDocFileId',
      'isVerifiedFlag'
    )
    .where({
      tutorProfileId: profile.tutorProfileId,
      isActiveFlag: true,
    })
    .orderBy('graduationYear', 'desc');

  // Return result
  return {
    tutorProfileId: profile.tutorProfileId,
    userId: profile.userId,
    bio: profile.bio || null,
    hourlyRate: profile.hourlyRate != null ? Number(profile.hourlyRate) : null,
    teachingLocationType: profile.teachingLocationType,
    latitude: profile.latitude != null ? Number(profile.latitude) : null,
    longitude: profile.longitude != null ? Number(profile.longitude) : null,
    serviceRadiusKm: profile.serviceRadiusKm != null ? Number(profile.serviceRadiusKm) : null,
    paymentDetails: (profile.paymentDetails as Record<string, unknown>) || null,
    introVideoFileId: profile.introVideoFileId || null,
    introVideoStatus: profile.introVideoStatus || null,
    verificationStatus: profile.verificationStatus,
    popularityScore: Number(profile.popularityScore || 0),
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
    educations: educations.map((edu) => ({
      tutorEducationId: edu.tutorEducationId,
      institution: edu.institution,
      degree: edu.degree || null,
      fieldOfStudy: edu.fieldOfStudy || null,
      graduationYear: edu.graduationYear ?? null,
      verificationDocFileId: edu.verificationDocFileId || null,
      isVerifiedFlag: edu.isVerifiedFlag,
    })),
  };
}

/**
 * ============================================================================
 * @name    me_003_e
 * @desc    Update the tutor profile and taught subjects of the authenticated user.
 *
 * ============================================================================
 */
export async function editMyTutorProfile(
  input: EditMyTutorProfileInput,
  user: UserPayload
): Promise<EditMyTutorProfileResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const profile = await getOrCreateTutorProfile(user, trx);

    // Prepare data
    const updateData: Record<string, unknown> = {
      ...auditUpdate(user.userLogName),
    };

    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }
    if (input.hourlyRate !== undefined) {
      updateData.hourlyRate = input.hourlyRate;
    }
    if (input.teachingLocationType !== undefined) {
      updateData.teachingLocationType = input.teachingLocationType;
    }
    if (input.serviceRadiusKm !== undefined) {
      updateData.serviceRadiusKm = input.serviceRadiusKm;
    }
    if (input.paymentDetails !== undefined) {
      updateData.paymentDetails = input.paymentDetails;
    }
    if (input.introVideoFileId !== undefined) {
      updateData.introVideoFileId = input.introVideoFileId;
      updateData.introVideoStatus = input.introVideoFileId ? introVideoStatusType.READY : null;
    }
    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (input.latitude !== null && input.longitude !== null) {
        updateData.location = trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [input.longitude, input.latitude]);
      } else {
        updateData.location = null;
      }
    }

    // Update data
    const [updatedProfile] = await trx('TutorProfile')
      .where({ tutorProfileId: profile.tutorProfileId })
      .update(updateData)
      .returning<TutorProfile[]>('*');
    if (!updatedProfile) {
      throw new ApiError(500, 'me_003_e_s_01', 'Failed to update tutor profile.');
    }

    if (input.subjects !== undefined) {
      await trx('TutorSubject')
        .where({ tutorProfileId: profile.tutorProfileId, isActiveFlag: true })
        .update(auditSoftDelete(user.userLogName));

      if (input.subjects.length > 0) {
        const subjectRows: Partial<TutorSubject>[] = input.subjects.map((sub) => ({
          tutorProfileId: profile.tutorProfileId,
          subjectId: sub.subjectId,
          proficiencyLevel: sub.proficiencyLevel || null,
          gradeLevels: sub.gradeLevels || [],
          specializedTopics: sub.specializedTopics || [],
          customHourlyRate: sub.customHourlyRate ?? null,
          ...auditCreate(user.userLogName),
        }));
        await trx('TutorSubject').insert(subjectRows);
      }
    }

    // Return result
    return {
      tutorProfileId: updatedProfile.tutorProfileId,
    };
  });
}

/**
 * ============================================================================
 * @name    me_003_edu_c
 * @desc    Add an education record to the tutor profile.
 *
 * ============================================================================
 */
export async function createTutorEducation(
  input: CreateTutorEducationInput,
  user: UserPayload
): Promise<CreateTutorEducationResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const profile = await getOrCreateTutorProfile(user, trx);

    // Prepare data
    const newEduData: Partial<TutorEducation> = {
      tutorProfileId: profile.tutorProfileId,
      institution: input.institution,
      degree: input.degree || null,
      fieldOfStudy: input.fieldOfStudy || null,
      graduationYear: input.graduationYear ?? null,
      verificationDocFileId: input.verificationDocFileId || null,
      isVerifiedFlag: false,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdEdu] = await trx('TutorEducation').insert(newEduData).returning<TutorEducation[]>('*');
    if (!createdEdu) {
      throw new ApiError(500, 'me_003_edu_c_s_01', 'Failed to create tutor education record.');
    }

    // Return result
    return {
      tutorEducationId: createdEdu.tutorEducationId,
      institution: createdEdu.institution,
      degree: createdEdu.degree || null,
      fieldOfStudy: createdEdu.fieldOfStudy || null,
      graduationYear: createdEdu.graduationYear ?? null,
      verificationDocFileId: createdEdu.verificationDocFileId || null,
      isVerifiedFlag: createdEdu.isVerifiedFlag,
    };
  });
}

/**
 * ============================================================================
 * @name    me_003_edu_d
 * @desc    Soft-delete an education record from the tutor profile.
 *
 * ============================================================================
 */
export async function deleteTutorEducation(
  params: DeleteTutorEducationParams,
  user: UserPayload
): Promise<DeleteTutorEducationResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const profile = await getOrCreateTutorProfile(user, trx);

    const existingEdu = await trx('TutorEducation')
      .where({
        tutorEducationId: params.eduId,
        tutorProfileId: profile.tutorProfileId,
        isActiveFlag: true,
      })
      .first<TutorEducation>();
    if (!existingEdu) {
      throw new ApiError(404, 'me_003_edu_d_s_01', 'Education record not found or inactive.');
    }

    // -----------------------------------
    // Delete main record
    // -----------------------------------
    const [deletedEdu] = await trx('TutorEducation')
      .where({ tutorEducationId: existingEdu.tutorEducationId })
      .update(auditSoftDelete(user.userLogName))
      .returning<TutorEducation[]>('*');
    if (!deletedEdu) {
      throw new ApiError(500, 'me_003_edu_d_s_02', 'Failed to delete education record.');
    }

    // Return result
    return {
      tutorEducationId: deletedEdu.tutorEducationId,
    };
  });
}

/**
 * ============================================================================
 * @name    me_003_avail_g
 * @desc    Retrieve the availability schedule of the authenticated tutor.
 *
 * ============================================================================
 */
export async function getTutorAvailability(user: UserPayload): Promise<GetTutorAvailabilityResponse> {
  // Check existing data
  const profile = await getOrCreateTutorProfile(user, db);

  // Build query
  const slots = await db('TutorAvailability')
    .select('tutorAvailabilityId', 'dayOfWeek', 'specificDate', 'startTime', 'endTime', 'isAvailableFlag')
    .where({
      tutorProfileId: profile.tutorProfileId,
      isActiveFlag: true,
    })
    .orderBy([
      { column: 'dayOfWeek', order: 'asc' },
      { column: 'specificDate', order: 'asc' },
      { column: 'startTime', order: 'asc' },
    ]);

  // Return result
  return {
    tutorProfileId: profile.tutorProfileId,
    slots: slots.map((slot) => ({
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
 * @name    me_003_avail_e
 * @desc    Replace the availability schedule of the authenticated tutor.
 *
 * ============================================================================
 */
export async function editTutorAvailability(
  input: EditTutorAvailabilityInput,
  user: UserPayload
): Promise<EditTutorAvailabilityResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const profile = await getOrCreateTutorProfile(user, trx);

    // Prepare data
    for (const slot of input.slots) {
      const hasDay = slot.dayOfWeek !== undefined && slot.dayOfWeek !== null;
      const hasDate = slot.specificDate !== undefined && slot.specificDate !== null;
      if (hasDay === hasDate) {
        throw new ApiError(
          400,
          'me_003_avail_e_s_01',
          'Each availability slot must specify either dayOfWeek or specificDate, not both.'
        );
      }
    }

    // -----------------------------------
    // Delete main record
    // -----------------------------------
    await trx('TutorAvailability')
      .where({ tutorProfileId: profile.tutorProfileId, isActiveFlag: true })
      .update(auditSoftDelete(user.userLogName));

    // -----------------------------------
    // Insert data
    // -----------------------------------
    let insertedSlots: TutorAvailability[] = [];
    if (input.slots.length > 0) {
      const rowsToInsert: Partial<TutorAvailability>[] = input.slots.map((slot) => ({
        tutorProfileId: profile.tutorProfileId,
        dayOfWeek: slot.dayOfWeek ?? null,
        specificDate: slot.specificDate || null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailableFlag: slot.isAvailableFlag ?? true,
        ...auditCreate(user.userLogName),
      }));

      insertedSlots = await trx('TutorAvailability').insert(rowsToInsert).returning<TutorAvailability[]>('*');
    }

    // Return result
    return {
      tutorProfileId: profile.tutorProfileId,
      slots: insertedSlots.map((slot) => ({
        tutorAvailabilityId: slot.tutorAvailabilityId,
        dayOfWeek: slot.dayOfWeek ?? null,
        specificDate: slot.specificDate ? String(slot.specificDate).slice(0, 10) : null,
        startTime: String(slot.startTime).slice(0, 5),
        endTime: String(slot.endTime).slice(0, 5),
        isAvailableFlag: slot.isAvailableFlag,
      })),
    };
  });
}

/**
 * ============================================================================
 * @name    me_003_req_c
 * @desc    Submit a tutor profile change request requiring admin approval.
 *
 * ============================================================================
 */
export async function createProfileChangeRequest(
  input: CreateProfileChangeRequestInput,
  user: UserPayload
): Promise<CreateProfileChangeRequestResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const profile = await getOrCreateTutorProfile(user, trx);

    // Prepare data
    const newRequestData: Partial<ProfileChangeRequest> = {
      tutorProfileId: profile.tutorProfileId,
      requestedChanges: input.requestedChanges,
      supportingDocFileId: input.supportingDocFileId || null,
      status: changeRequestStatusType.PENDING,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdRequest] = await trx('ProfileChangeRequest')
      .insert(newRequestData)
      .returning<ProfileChangeRequest[]>('*');
    if (!createdRequest) {
      throw new ApiError(500, 'me_003_req_c_s_01', 'Failed to submit profile change request.');
    }

    // Return result
    return {
      profileChangeRequestId: createdRequest.profileChangeRequestId,
      status: createdRequest.status,
      createdAt: new Date(createdRequest.createdAt).toISOString(),
    };
  });
}
