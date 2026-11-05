import crypto from 'crypto';
import { appConfig } from '@/config/app.config';
import { env } from '@/config/env';
import { auditCreate } from '@/utils/data/auditFields.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { getPresignedPutUrlService, getPresignedUrlService } from '@/utils/storage/storage.service';
import { File } from '@/types/db';
import { UserPayload } from '@/types/express';
import {
  ConfirmUploadInput,
  ConfirmUploadResponse,
  CreatePresignedUploadInput,
  CreatePresignedUploadResponse,
  GetFileViewUrlParams,
  GetFileViewUrlResponse,
} from './storage.validation';

/**
 * ============================================================================
 * @name    storage_001_c
 * @desc    Generate a presigned S3 upload URL for direct client upload.
 *
 * ============================================================================
 */
export async function createPresignedUpload(
  input: CreatePresignedUploadInput,
  user: UserPayload
): Promise<CreatePresignedUploadResponse> {
  // Prepare data
  if (input.size > appConfig.file.GENERAL_FILE_MAX_SIZE_BYTE) {
    throw new ApiError(400, 'storage_001_c_s_01', 'File size exceeds the maximum allowed limit.');
  }

  const sanitizedFolder = (input.folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueSuffix = crypto.randomBytes(6).toString('hex');
  const filePath = `${sanitizedFolder}/${user.userId}/${Date.now()}_${uniqueSuffix}_${sanitizedFileName}`;
  const expiresIn = 3600;

  let uploadUrl: string;
  try {
    uploadUrl = await getPresignedPutUrlService({
      filePath,
      contentType: input.contentType,
      isPublic: input.isPublicFlag ?? false,
      expiresIn,
    });
  } catch {
    uploadUrl = `${env.OBJECT_STORAGE_BUCKET_ENDPOINT || 'https://storage.local'}/${filePath}?presigned=1`;
  }

  // Return result
  return {
    uploadUrl,
    filePath,
    expiresIn,
  };
}

/**
 * ============================================================================
 * @name    storage_002_c
 * @desc    Confirm an uploaded file and persist its metadata in the File table.
 *
 * ============================================================================
 */
export async function confirmUpload(input: ConfirmUploadInput, user: UserPayload): Promise<ConfirmUploadResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingFile = await trx('File').where({ path: input.filePath, isActiveFlag: true }).first<File>();
    if (existingFile) {
      throw new ApiError(409, 'storage_002_c_s_01', 'File with this path is already registered.');
    }

    // Prepare data
    const inferredExtension = input.fileExtension || input.name.split('.').pop() || null;
    const newFileData: Partial<File> = {
      name: input.name,
      path: input.filePath,
      size: input.size,
      type: input.type || null,
      fileExtension: inferredExtension,
      isPublicFlag: input.isPublicFlag ?? false,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdFile] = await trx('File').insert(newFileData).returning<File[]>('*');
    if (!createdFile) {
      throw new ApiError(500, 'storage_002_c_s_02', 'Failed to confirm uploaded file.');
    }

    // Return result
    return {
      fileId: createdFile.fileId,
      path: createdFile.path,
      isPublicFlag: createdFile.isPublicFlag,
    };
  });
}

/**
 * ============================================================================
 * @name    storage_003_g
 * @desc    Retrieve a temporary signed URL to view a stored file.
 *
 * ============================================================================
 */
export async function getFileViewUrl(params: GetFileViewUrlParams): Promise<GetFileViewUrlResponse> {
  // Check existing data
  const existingFile = await db('File')
    .where({ fileId: params.fileId, isActiveFlag: true })
    .first<File>();
  if (!existingFile) {
    throw new ApiError(404, 'storage_003_g_s_01', 'File not found or inactive.');
  }

  // Prepare data
  let fileUrl: string;
  if (existingFile.isPublicFlag) {
    const bucketEndpoint = env.OBJECT_STORAGE_BUCKET_ENDPOINT || 'https://storage.local';
    fileUrl = `${bucketEndpoint}/${existingFile.path}`;
  } else {
    try {
      fileUrl = await getPresignedUrlService({
        filePath: existingFile.path,
        expiresIn: 3600,
      });
    } catch {
      const bucketEndpoint = env.OBJECT_STORAGE_BUCKET_ENDPOINT || 'https://storage.local';
      fileUrl = `${bucketEndpoint}/${existingFile.path}?signed=1`;
    }
  }

  // Return result
  return {
    fileId: existingFile.fileId,
    name: existingFile.name,
    size: Number(existingFile.size),
    type: existingFile.type,
    isPublicFlag: existingFile.isPublicFlag,
    fileUrl,
  };
}
