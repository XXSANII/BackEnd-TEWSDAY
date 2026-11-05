import { Knex } from 'knex';
import { getAuthRedisKey } from '@/utils/cache/getTemplateRedisKey.helper';
import { auditCreate, auditUpdate } from '@/utils/data/auditFields.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { redis } from '@/utils/redis';
import { StudentProfile } from '@/types/db';
import { UserPayload } from '@/types/express';
import {
  EditMyStudentProfileInput,
  EditMyStudentProfileResponse,
  EditStudentEmergencyContactInput,
  EditStudentEmergencyContactResponse,
  GetMyStudentProfileResponse,
} from './student.validation';

async function getOrCreateStudentProfile(
  user: UserPayload,
  trxOrDb: Knex | Knex.Transaction
): Promise<StudentProfile & { latitude?: number | null; longitude?: number | null }> {
  let profile = await trxOrDb('StudentProfile')
    .select(
      'StudentProfile.*',
      trxOrDb.raw('ST_Y("location"::geometry) as "latitude"'),
      trxOrDb.raw('ST_X("location"::geometry) as "longitude"')
    )
    .where({ userId: user.userId, isActiveFlag: true })
    .first<StudentProfile & { latitude?: number | null; longitude?: number | null }>();

  if (!profile) {
    const newProfileData: Partial<StudentProfile> = {
      userId: user.userId,
      ...auditCreate(user.userLogName),
    };
    const [created] = await trxOrDb('StudentProfile').insert(newProfileData).returning<StudentProfile[]>('*');
    if (!created) {
      throw new ApiError(500, 'me_004_g_s_01', 'Failed to initialize student profile.');
    }
    await redis.del(getAuthRedisKey(user.token));
    profile = { ...created, latitude: null, longitude: null };
  }

  return profile;
}

/**
 * ============================================================================
 * @name    me_004_g
 * @desc    Retrieve the student profile and emergency contact of the authenticated user.
 *
 * ============================================================================
 */
export async function getMyStudentProfile(user: UserPayload): Promise<GetMyStudentProfileResponse> {
  // Check existing data
  const profile = await getOrCreateStudentProfile(user, db);

  // Return result
  return {
    studentProfileId: profile.studentProfileId,
    userId: profile.userId,
    currentGradeLevel: profile.currentGradeLevel || null,
    schoolName: profile.schoolName || null,
    latitude: profile.latitude != null ? Number(profile.latitude) : null,
    longitude: profile.longitude != null ? Number(profile.longitude) : null,
    parentName: profile.parentName || null,
    parentPhone: profile.parentPhone || null,
    emergencyContact: (profile.emergencyContact as Record<string, unknown>) || null,
  };
}

/**
 * ============================================================================
 * @name    me_004_e
 * @desc    Update the student profile details and location of the authenticated user.
 *
 * ============================================================================
 */
export async function editMyStudentProfile(
  input: EditMyStudentProfileInput,
  user: UserPayload
): Promise<EditMyStudentProfileResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const profile = await getOrCreateStudentProfile(user, trx);

    // Prepare data
    const updateData: Record<string, unknown> = {
      ...auditUpdate(user.userLogName),
    };

    if (input.currentGradeLevel !== undefined) {
      updateData.currentGradeLevel = input.currentGradeLevel;
    }
    if (input.schoolName !== undefined) {
      updateData.schoolName = input.schoolName;
    }
    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (input.latitude !== null && input.longitude !== null) {
        updateData.location = trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [input.longitude, input.latitude]);
      } else {
        updateData.location = null;
      }
    }

    // Update data
    const [updatedProfile] = await trx('StudentProfile')
      .where({ studentProfileId: profile.studentProfileId })
      .update(updateData)
      .returning<StudentProfile[]>('*');
    if (!updatedProfile) {
      throw new ApiError(500, 'me_004_e_s_01', 'Failed to update student profile.');
    }

    // Return result
    return {
      studentProfileId: updatedProfile.studentProfileId,
    };
  });
}

/**
 * ============================================================================
 * @name    me_004_emergency_e
 * @desc    Update the parent and emergency contact information of the student profile.
 *
 * ============================================================================
 */
export async function editStudentEmergencyContact(
  input: EditStudentEmergencyContactInput,
  user: UserPayload
): Promise<EditStudentEmergencyContactResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const profile = await getOrCreateStudentProfile(user, trx);

    // Prepare data
    const updateData: Partial<StudentProfile> = {
      ...(input.parentName !== undefined ? { parentName: input.parentName } : {}),
      ...(input.parentPhone !== undefined ? { parentPhone: input.parentPhone } : {}),
      ...(input.emergencyContact !== undefined ? { emergencyContact: input.emergencyContact } : {}),
      ...auditUpdate(user.userLogName),
    };

    // Update data
    const [updatedProfile] = await trx('StudentProfile')
      .where({ studentProfileId: profile.studentProfileId })
      .update(updateData)
      .returning<StudentProfile[]>('*');
    if (!updatedProfile) {
      throw new ApiError(500, 'me_004_emergency_e_s_01', 'Failed to update emergency contact information.');
    }

    // Return result
    return {
      studentProfileId: updatedProfile.studentProfileId,
      parentName: updatedProfile.parentName || null,
      parentPhone: updatedProfile.parentPhone || null,
      emergencyContact: (updatedProfile.emergencyContact as Record<string, unknown>) || null,
    };
  });
}
