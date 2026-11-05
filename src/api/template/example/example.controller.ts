import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as exampleService from './example.service';
import { createExampleSchema, deleteExampleSchema, editExampleSchema, getExampleSchema, searchExampleSchema } from './example.validation';

/**
 * ============================================================================
 * @name    createExample
 * @code    tmp_001_c
 * @route   POST /api/v1/template/example/create
 * @desc    Create an example.
 *
 * ============================================================================
 */
export const createExampleHandler = asyncHandler('tmp_001_c', async (req) => {
  // Validate request body
  const { body } = createExampleSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const createdExample = await exampleService.createExample(body, user);

  // Send response
  return { message: 'Example created successfully.', data: createdExample, status: 201 };
});

/**
 * ============================================================================
 * @name    deleteExample
 * @code    tmp_001_d
 * @route   DELETE /api/v1/template/example/:exampleId/delete
 * @desc    Delete an example.
 *
 * ============================================================================
 */
export const deleteExampleHandler = asyncHandler('tmp_001_d', async (req) => {
  // Recheck request info
  const { params } = deleteExampleSchema.parse(req);
  if (!params.exampleId) {
    throw new Error('Example info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const deletedExample = await exampleService.deleteExample(params, user);

  // Send response
  return { message: 'Example deleted successfully.', data: deletedExample };
});

/**
 * ============================================================================
 * @name    editExample
 * @code    tmp_001_e
 * @route   PUT /api/v1/template/example/:exampleId/edit
 * @desc    Edit an example.
 *
 * ============================================================================
 */
export const editExampleHandler = asyncHandler('tmp_001_e', async (req) => {
  // Validate request body
  const { params, body } = editExampleSchema.parse(req);
  if (!params.exampleId) {
    throw new Error('Example info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const editedExample = await exampleService.editExample(params, body, user);

  // Send response
  return { message: 'Example edited successfully.', data: editedExample };
});

/**
 * ============================================================================
 * @name    getExample
 * @code    tmp_001_g
 * @route   GET /api/v1/template/example/:exampleId/get
 * @desc    Get an example.
 *
 * ============================================================================
 */
export const getExampleHandler = asyncHandler('tmp_001_g', async (req) => {
  // Recheck request info
  const { params } = getExampleSchema.parse(req);
  if (!params.exampleId) {
    throw new Error('Example info is missing in request.');
  }

  // Call service
  const getResult = await exampleService.getExample(params);

  // Send response
  return { message: 'Example retrieved successfully.', data: getResult };
});

/**
 * ============================================================================
 * @name    searchExample
 * @code    tmp_001_s
 * @route   POST /api/v1/template/example/search
 * @desc    Search examples.
 *
 * ============================================================================
 */
export const searchExampleHandler = asyncHandler('tmp_001_s', async (req) => {
  // Validate request body
  const { body } = searchExampleSchema.parse(req);

  // Call service
  const searchResult = await exampleService.searchExample(body);

  // Send response
  return { message: 'Example searched successfully.', data: searchResult };
});
