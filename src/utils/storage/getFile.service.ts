import { File } from '@/types/db';
import { db } from '../db';
import { checkFileExistInS3Service, getPresignedUrlService } from './storage.service';
import { ObjectBucketType } from '@/constants/storage.constants';
import { Knex } from 'knex';
import { env } from '@/config/env';

interface GetFileParamsConfig {
  fileName?: string;
  expiresInSeconds?: number;
  trx?: Knex | Knex.Transaction;
}

interface GetFileResponse {
  fileId: string;
  bucket: ObjectBucketType;
  size: number;
  type: string | null;
  fileExtension: string | null;
  isPublicFlag: boolean;
  fileUrl: string | null; // Contains the full URL or path to the file in storage (auto presigned)
}

const MOCK_RETURN = {
  fileId: '',
  bucket: env.OBJECT_STORAGE_BUCKET,
  size: 0,
  type: null,
  fileExtension: null,
  isPublicFlag: false,
  fileUrl: null,
};

/**
 * ============================================================================
 * @name    getFile
 * @code    file_008
 * @desc    Retrieve file metadata from the database by file path.
 *
 * ============================================================================
 */
export async function getFile(
  fileId: string | null,
  config: GetFileParamsConfig = {
    fileName: 'File',
    expiresInSeconds: 3600,
    trx: db,
  }
): Promise<GetFileResponse> {
  const { expiresInSeconds, trx = db, fileName } = config;

  // Check existence in DB
  // File not found in DB - return null without throwing error
  const existingFile = await trx('File')
    .where({
      fileId: fileId,
      isActiveFlag: true,
    })
    .first<File>();
  if (!existingFile) {
    return MOCK_RETURN;
  }

  // Check public or private and generate URL accordingly
  // For public we will ignore the existingFile and just contact the bucket endpoint with the file path
  let fileUrl = '';
  if (existingFile.isPublicFlag) {
    // PUBLIC CASE
    const bucketEndpoint = env.OBJECT_STORAGE_BUCKET_ENDPOINT as string;
    fileUrl = `${bucketEndpoint}/${existingFile.path}`;
  } else {
    // Check existence in S3
    // File not found in DB - return null without throwing error
    const fileExists = await checkFileExistInS3Service({
      filePath: existingFile.path,
    });
    if (!fileExists) {
      return MOCK_RETURN;
    }

    // PRIVATE CASE
    let finalFileName = fileName || existingFile.name;
    if (
      existingFile.fileExtension &&
      !finalFileName.toLowerCase().endsWith(`.${existingFile.fileExtension.toLowerCase()}`)
    ) {
      finalFileName += `.${existingFile.fileExtension}`;
    }

    fileUrl = await getPresignedUrlService({
      filePath: existingFile.path,
      expiresIn: expiresInSeconds,
      downloadFilename: finalFileName,
    });
  }

  const responseFile: GetFileResponse = {
    ...existingFile,
    bucket: env.OBJECT_STORAGE_BUCKET,
    fileUrl: fileUrl,
  };

  return responseFile;
}
