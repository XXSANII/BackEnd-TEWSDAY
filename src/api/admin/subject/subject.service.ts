import { auditCreate, auditUpdate } from '@/utils/data/auditFields.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { Subject } from '@/types/db';
import { UserPayload } from '@/types/express';
import {
  CreateSubjectInput,
  CreateSubjectResponse,
  EditSubjectInput,
  EditSubjectParams,
  EditSubjectResponse,
} from './subject.validation';

/**
 * ============================================================================
 * @name    adm_003_c
 * @desc    Create a new subject in the catalog.
 *
 * ============================================================================
 */
export async function createSubject(
  input: CreateSubjectInput,
  user: UserPayload
): Promise<CreateSubjectResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingSubject = await trx('Subject')
      .whereRaw('lower("name") = ?', [input.name.trim().toLowerCase()])
      .andWhere({ isActiveFlag: true })
      .first<Subject>();
    if (existingSubject) {
      throw new ApiError(409, 'adm_003_c_s_01', 'Subject with this name already exists.');
    }

    // Prepare data
    const newSubjectData: Partial<Subject> = {
      name: input.name.trim(),
      category: input.category.trim(),
      description: input.description || null,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdSubject] = await trx('Subject').insert(newSubjectData).returning<Subject[]>('*');
    if (!createdSubject) {
      throw new ApiError(500, 'adm_003_c_s_02', 'Failed to create subject.');
    }

    // Return result
    return {
      subjectId: createdSubject.subjectId,
      name: createdSubject.name,
      category: createdSubject.category,
      description: createdSubject.description || null,
    };
  });
}

/**
 * ============================================================================
 * @name    adm_003_e
 * @desc    Edit an existing subject in the catalog.
 *
 * ============================================================================
 */
export async function editSubject(
  params: EditSubjectParams,
  input: EditSubjectInput,
  user: UserPayload
): Promise<EditSubjectResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingSubject = await trx('Subject')
      .where({ subjectId: params.subjectId, isActiveFlag: true })
      .first<Subject>();
    if (!existingSubject) {
      throw new ApiError(404, 'adm_003_e_s_01', 'Subject not found or inactive.');
    }

    // Prepare data
    const updateData: Partial<Subject> = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...auditUpdate(user.userLogName),
    };

    // Update data
    const [updatedSubject] = await trx('Subject')
      .where({ subjectId: existingSubject.subjectId })
      .update(updateData)
      .returning<Subject[]>('*');
    if (!updatedSubject) {
      throw new ApiError(500, 'adm_003_e_s_02', 'Failed to update subject.');
    }

    // Return result
    return {
      subjectId: updatedSubject.subjectId,
      name: updatedSubject.name,
      category: updatedSubject.category,
      description: updatedSubject.description || null,
    };
  });
}
