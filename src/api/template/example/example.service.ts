import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { UserPayload } from '@/types/express';
import { Example } from '@/types/db';
import {
  CreateExampleInput,
  CreateExampleResponse,
  EditExampleInput,
  GetExampleResponse,
  SearchExampleInput,
  SearchExampleResponse,
  EditExampleResponse,
  DeleteExampleParams,
  DeleteExampleResponse,
  EditExampleParams,
  GetExampleParams,
  searchExampleValidSortKeys,
} from './example.validation';
import { applySort } from '@/utils/data/applySort.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { applyPagination } from '@/utils/data/applyPagination.helper';
import { auditCreate, auditUpdate, auditSoftDelete } from '@/utils/data/auditFields.helper';

/**
 * ============================================================================
 * @name    tmp_001_c
 * @desc    Create an example.
 *
 * ============================================================================
 */
export async function createExample(input: CreateExampleInput, user: UserPayload): Promise<CreateExampleResponse> {
  return db.transaction(async (trx) => {
    // Prepare data
    const { name } = input;
    const newExampleData: Partial<Example> = {
      name,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [newExample] = await trx('Example').insert(newExampleData).returning('exampleId as exampleId');
    if (!newExample) {
      throw new ApiError(500, 'tmp_001_c_s_01', 'Failed to create example.');
    }

    return newExample;
  });
}

/**
 * ============================================================================
 * @name    tmp_001_d
 * @desc    Delete an example.
 *
 * ============================================================================
 */
export async function deleteExample(params: DeleteExampleParams, user: UserPayload): Promise<DeleteExampleResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingExample = await db('Example')
      .where({
        exampleId: params.exampleId,
        isActiveFlag: true,
      })
      .first<Example>();
    if (!existingExample) {
      throw new ApiError(404, 'tmp_001_d_s_01', 'Example not found');
    }

    // -----------------------------------
    // Delete main record
    // -----------------------------------
    const updateDeleteData: Partial<Example> = auditSoftDelete(user.userLogName);
    const [deletedExample] = await trx('Example')
      .where({
        exampleId: existingExample.exampleId,
      })
      .update(updateDeleteData)
      .returning<Example[]>('*');
    if (!deletedExample) {
      throw new ApiError(500, 'tmp_001_d_s_02', 'Failed to delete example');
    }

    return {
      exampleId: deletedExample.exampleId,
    };
  });
}

/**
 * ============================================================================
 * @name    tmp_001_e
 * @desc    Edit an example.
 *
 * ============================================================================
 */

export async function editExample(params: EditExampleParams, input: EditExampleInput, user: UserPayload): Promise<EditExampleResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingExample = await trx('Example').where({ exampleId: params.exampleId, isActiveFlag: true }).first<Example>();
    if (!existingExample) {
      throw new ApiError(404, 'tmp_001_e_s_01', 'Example not found or inactive.');
    }

    // Prepare data
    const { name } = input;
    const updateData: Partial<Example> = {
      name,
      ...auditUpdate(user.userLogName),
    };

    const [updatedExample] = await trx('Example').where({ exampleId: params.exampleId }).update(updateData).returning('exampleId as exampleId');
    if (!updatedExample) {
      throw new ApiError(500, 'tmp_001_e_s_02', 'Failed to update example.');
    }

    return updatedExample;
  });
}

/**
 * ============================================================================
 * @name    tmp_001_g
 * @desc    Get an example.
 *
 * ============================================================================
 */
export async function getExample(params: GetExampleParams): Promise<GetExampleResponse> {
  const example = await db('Example').select('exampleId', 'name').where({ exampleId: params.exampleId, isActiveFlag: true }).first<Example>();
  if (!example) {
    throw new ApiError(404, 'tmp_001_g_s_01', 'Example not found or inactive.');
  }

  return example;
}

/**
 * ============================================================================
 * @name    tmp_001_s
 * @desc    Search examples.
 *
 * ============================================================================
 */

export async function searchExample(input: SearchExampleInput): Promise<SearchExampleResponse> {
  // Build query
  let query = db('Example').select('exampleId', 'name').where({ isActiveFlag: true });

  // Apply filters
  if (input.name) {
    query.where('name', 'ilike', `%${input.name}%`);
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchExampleValidSortKeys,
  });

  // Apply pagination
  const totalCountResult = await query.clone().clearSelect().clearOrder().count().first<{ count: string }>();
  const totalCount = parseInt(totalCountResult.count || '0', 10);
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
  const examples = await query;

  // Return result
  const returnResult: SearchExampleResponse = {
    total: totalCount,
    pagination,
    data: examples,
  };
  return returnResult;
}
