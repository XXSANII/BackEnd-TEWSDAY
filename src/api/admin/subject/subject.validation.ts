import z from 'zod';

/**
 * ============================================================================
 * @name    createSubjectSchema
 * @code    adm_003_c
 * @desc    Create subject schema
 *
 * ============================================================================
 */
export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string('adm_003_c_v_01').min(1, 'adm_003_c_v_02').max(100, 'adm_003_c_v_02'),
    category: z.string('adm_003_c_v_03').min(1, 'adm_003_c_v_04').max(50, 'adm_003_c_v_04'),
    description: z.string('adm_003_c_v_05').max(1000, 'adm_003_c_v_05').optional().nullable(),
  }),
});

export const createSubjectResponseSchema = z.object({
  subjectId: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>['body'];
export type CreateSubjectResponse = z.infer<typeof createSubjectResponseSchema>;

/**
 * ============================================================================
 * @name    editSubjectSchema
 * @code    adm_003_e
 * @desc    Edit subject schema
 *
 * ============================================================================
 */
export const editSubjectSchema = z.object({
  params: z.object({
    subjectId: z.uuidv4('adm_003_e_v_01'),
  }),
  body: z.object({
    name: z.string('adm_003_e_v_02').min(1, 'adm_003_e_v_03').max(100, 'adm_003_e_v_03').optional(),
    category: z.string('adm_003_e_v_04').min(1, 'adm_003_e_v_05').max(50, 'adm_003_e_v_05').optional(),
    description: z.string('adm_003_e_v_06').max(1000, 'adm_003_e_v_06').optional().nullable(),
  }),
});

export const editSubjectResponseSchema = z.object({
  subjectId: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
});

export type EditSubjectParams = z.infer<typeof editSubjectSchema>['params'];
export type EditSubjectInput = z.infer<typeof editSubjectSchema>['body'];
export type EditSubjectResponse = z.infer<typeof editSubjectResponseSchema>;
