import z from 'zod';
import { telRegEx } from '@/utils/validation/regex';

/**
 * ============================================================================
 * @name    getMyStudentProfileSchema
 * @code    me_004_g
 * @desc    Get current user student profile schema
 *
 * ============================================================================
 */
export const getMyStudentProfileSchema = z.object({
  query: z.object({}).optional(),
});

export const getMyStudentProfileResponseSchema = z.object({
  studentProfileId: z.string(),
  userId: z.string(),
  currentGradeLevel: z.string().nullable(),
  schoolName: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  parentName: z.string().nullable(),
  parentPhone: z.string().nullable(),
  emergencyContact: z.record(z.string(), z.unknown()).nullable(),
});

export type GetMyStudentProfileResponse = z.infer<typeof getMyStudentProfileResponseSchema>;

/**
 * ============================================================================
 * @name    editMyStudentProfileSchema
 * @code    me_004_e
 * @desc    Edit current user student profile schema
 *
 * ============================================================================
 */
export const editMyStudentProfileSchema = z.object({
  body: z.object({
    currentGradeLevel: z.string('me_004_e_v_01').max(50, 'me_004_e_v_01').optional().nullable(),
    schoolName: z.string('me_004_e_v_02').max(150, 'me_004_e_v_02').optional().nullable(),
    latitude: z.number('me_004_e_v_03').min(-90, 'me_004_e_v_03').max(90, 'me_004_e_v_03').optional().nullable(),
    longitude: z.number('me_004_e_v_04').min(-180, 'me_004_e_v_04').max(180, 'me_004_e_v_04').optional().nullable(),
  }),
});

export const editMyStudentProfileResponseSchema = z.object({
  studentProfileId: z.string(),
});

export type EditMyStudentProfileInput = z.infer<typeof editMyStudentProfileSchema>['body'];
export type EditMyStudentProfileResponse = z.infer<typeof editMyStudentProfileResponseSchema>;

/**
 * ============================================================================
 * @name    editStudentEmergencyContactSchema
 * @code    me_004_emergency_e
 * @desc    Edit student emergency contact schema
 *
 * ============================================================================
 */
export const editStudentEmergencyContactSchema = z.object({
  body: z.object({
    parentName: z.string('me_004_emergency_e_v_01').max(150, 'me_004_emergency_e_v_01').optional().nullable(),
    parentPhone: z.string('me_004_emergency_e_v_02').regex(telRegEx, 'me_004_emergency_e_v_03').optional().nullable(),
    emergencyContact: z.record(z.string('me_004_emergency_e_v_04'), z.unknown()).optional().nullable(),
  }),
});

export const editStudentEmergencyContactResponseSchema = z.object({
  studentProfileId: z.string(),
  parentName: z.string().nullable(),
  parentPhone: z.string().nullable(),
  emergencyContact: z.record(z.string(), z.unknown()).nullable(),
});

export type EditStudentEmergencyContactInput = z.infer<typeof editStudentEmergencyContactSchema>['body'];
export type EditStudentEmergencyContactResponse = z.infer<typeof editStudentEmergencyContactResponseSchema>;
