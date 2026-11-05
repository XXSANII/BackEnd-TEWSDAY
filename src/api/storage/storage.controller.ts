import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as storageService from './storage.service';
import {
  confirmUploadSchema,
  createPresignedUploadSchema,
  getFileViewUrlSchema,
} from './storage.validation';

/**
 * ============================================================================
 * @name    createPresignedUpload
 * @code    storage_001_c
 * @route   POST /api/v1/storage/presigned-upload
 * @desc    Generate a presigned S3 upload URL for direct client upload.
 *
 * ============================================================================
 */
export const createPresignedUploadHandler = asyncHandler('storage_001_c', async (req) => {
  // Validate request body
  const { body } = createPresignedUploadSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const presignedResult = await storageService.createPresignedUpload(body, user);

  // Send response
  return { message: 'Presigned upload URL created successfully.', data: presignedResult, status: 201 };
});

/**
 * ============================================================================
 * @name    confirmUpload
 * @code    storage_002_c
 * @route   POST /api/v1/storage/confirm-upload
 * @desc    Confirm an uploaded file and persist its metadata in the File table.
 *
 * ============================================================================
 */
export const confirmUploadHandler = asyncHandler('storage_002_c', async (req) => {
  // Validate request body
  const { body } = confirmUploadSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const confirmedFile = await storageService.confirmUpload(body, user);

  // Send response
  return { message: 'File upload confirmed successfully.', data: confirmedFile, status: 201 };
});

/**
 * ============================================================================
 * @name    getFileViewUrl
 * @code    storage_003_g
 * @route   GET /api/v1/storage/:fileId/view-url
 * @desc    Retrieve a temporary signed URL to view a stored file.
 *
 * ============================================================================
 */
export const getFileViewUrlHandler = asyncHandler('storage_003_g', async (req) => {
  // Recheck request info
  const { params } = getFileViewUrlSchema.parse(req);
  if (!params.fileId) {
    throw new Error('File info is missing in request.');
  }

  // Call service
  const viewResult = await storageService.getFileViewUrl(params);

  // Send response
  return { message: 'File view URL retrieved successfully.', data: viewResult };
});
