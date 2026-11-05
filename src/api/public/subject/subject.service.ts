import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { Subject } from '@/types/db';
import {
  GetSubjectParams,
  GetSubjectResponse,
  SearchSubjectInput,
  SearchSubjectResponse,
  searchSubjectValidSortKeys,
} from './subject.validation';

/**
 * ============================================================================
 * @name    pub_001_g
 * @desc    Retrieve a subject by its ID.
 *
 * ============================================================================
 */
export async function getSubject(params: GetSubjectParams): Promise<GetSubjectResponse> {
  // Check existing data
  const subject = await db('Subject')
    .select('subjectId', 'name', 'category', 'description')
    .where({ subjectId: params.subjectId, isActiveFlag: true })
    .first<Subject>();
  if (!subject) {
    throw new ApiError(404, 'pub_001_g_s_01', 'Subject not found or inactive.');
  }

  // Return result
  return {
    subjectId: subject.subjectId,
    name: subject.name,
    category: subject.category,
    description: subject.description || null,
  };
}

/**
 * ============================================================================
 * @name    pub_001_s
 * @desc    Search available subjects with filtering and pagination.
 *
 * ============================================================================
 */
export async function searchSubject(input: SearchSubjectInput): Promise<SearchSubjectResponse> {
  // Build query
  let query = db('Subject').select('subjectId', 'name', 'category', 'description').where({ isActiveFlag: true });

  // Apply filters
  if (input.name) {
    query = query.where('name', 'ilike', `%${input.name}%`);
  }
  if (input.category) {
    query = query.where({ category: input.category });
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchSubjectValidSortKeys,
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
  const subjects: Subject[] = await query;

  // Return result
  const returnResult: SearchSubjectResponse = {
    total: totalCount,
    pagination,
    data: subjects.map((sub) => ({
      subjectId: sub.subjectId,
      name: sub.name,
      category: sub.category,
      description: sub.description || null,
    })),
  };
  return returnResult;
}
