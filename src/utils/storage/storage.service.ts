import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { s3Client } from '../storageClient';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectBucketType } from '@/constants/storage.constants';
import { ApiError } from '../error/ApiError';
import { CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { env } from '@/config/env';

/**
 * ============================================================================
 * @name    buildCacheControl
 * @desc    Builds the Cache-Control header value based on the file's public/private status.
 *
 * ============================================================================
 */
function buildCacheControl(isPublic: boolean): string {
  return isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store';
}

interface UploadFileToS3Params {
  bucket?: ObjectBucketType;
  filePath: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType: string;
  isPublic: boolean;
}

/**
 * ============================================================================
 * @name    uploadFileToS3
 * @code    file_001
 * @desc    Upload a file to S3.
 *
 * ============================================================================
 */
export async function uploadFileToS3({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
  body,
  contentType,
  isPublic = false,
}: UploadFileToS3Params) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filePath,
    Body: body,
    ContentType: contentType,
    ACL: isPublic ? 'public-read' : undefined,
    CacheControl: buildCacheControl(isPublic),
  });

  try {
    const response = await s3Client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new ApiError(500, 'file_001_01', 'Failed to upload file.');
    }
  } catch (err) {
    throw new ApiError(500, 'file_001_02', 'S3 error occurred during file upload.');
  }
}

/**
 * ============================================================================
 * @name    CheckFileExistInS3Params
 * @code    file_002
 * @desc    Check if a file exists in S3.
 *
 * ============================================================================
 */
interface CheckFileExistInS3Params {
  bucket?: ObjectBucketType;
  filePath: string;
}
export async function checkFileExistInS3Service({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
}: CheckFileExistInS3Params) {
  const command = new HeadObjectCommand({ Bucket: bucket, Key: filePath });

  try {
    await s3Client.send(command);
    return true; // The file exists
  } catch (err: any) {
    if (
      err.name === 'NotFound' ||
      err.name === 'NoSuchKey' || // Sometimes AWS SDK returns this name
      err.$metadata?.httpStatusCode === 404 ||
      err.$metadata?.httpStatusCode === 403 // Treat 403 as "File not found" for existence checks
    ) {
      return false;
    }

    throw new ApiError(500, 'file_002_01', 'S3 error occurred during file existence check.');
  }
}

interface GetPresignedUrlFileInS3Params {
  bucket?: ObjectBucketType;
  filePath: string;
  expiresIn?: number; // in seconds
  downloadFilename?: string; // Optional filename for download
}

/**
 * ============================================================================
 * @name    getPresignedUrlService
 * @code    file_003
 * @desc    Generate a presigned URL for a file in S3.
 *
 * ============================================================================
 */
export async function getPresignedUrlService({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
  expiresIn = 3600,
  downloadFilename,
}: GetPresignedUrlFileInS3Params) {
  try {
    const commandParams: any = {
      Bucket: bucket,
      Key: filePath,
    };

    // If a filename is provided, force DO Spaces to tell the browser to download it!
    if (downloadFilename) {
      commandParams.ResponseContentDisposition = `attachment; filename="${encodeURIComponent(downloadFilename)}"`;
    }

    const command = new GetObjectCommand(commandParams);
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
  } catch (err) {
    throw new ApiError(500, 'file_003_01', 'Failed to generate presigned URL for file.');
  }
}

interface GetPresignedPutUrlParams {
  bucket?: ObjectBucketType;
  filePath: string;
  contentType: string;
  isPublic?: boolean;
  expiresIn?: number;
}

/**
 * ============================================================================
 * @name    getPresignedPutUrlService
 * @code    file_013
 * @desc    Generate a presigned PUT URL for uploading a file directly to S3.
 *
 * ============================================================================
 */
export async function getPresignedPutUrlService({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
  contentType,
  isPublic = false,
  expiresIn = 3600,
}: GetPresignedPutUrlParams) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : undefined,
      CacheControl: buildCacheControl(isPublic),
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (err) {
    throw new ApiError(500, 'file_013_01', 'Failed to generate presigned upload URL.');
  }
}

interface GetFileStreamInS3Params {
  bucket?: ObjectBucketType;
  filePath: string;
}

/**
 * ============================================================================
 * @name    getFileStreamInS3Service
 * @code    file_004
 * @desc    Retrieve a file stream from S3.
 *
 * ============================================================================
 */
export async function getFileStreamInS3Service({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
}: GetFileStreamInS3Params) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    const response = await s3Client.send(command);
    const metaData = {
      ...response.Metadata,
      fileName: filePath.split('/').pop(),
      filePath: `${bucket}/${filePath}`,
      contentLength: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
    };

    return {
      fileStream: response.Body,
      metaData,
    };
  } catch (err) {
    throw new ApiError(500, 'file_004_01', 'Failed to retrieve file stream from S3.');
  }
}

interface RemoveFileFromS3Params {
  bucket?: ObjectBucketType;
  filePath: string;
}

/**
 * ============================================================================
 * @name    removeFileFromS3Service
 * @code    file_005
 * @desc    Remove a file from S3.
 *
 * ============================================================================
 */
export async function removeFileFromS3Service({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
}: RemoveFileFromS3Params) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: filePath,
  });

  try {
    const response = await s3Client.send(command);
    if (response.$metadata.httpStatusCode !== 204) {
      throw new ApiError(500, 'file_005_01', 'File removal failed.');
    }
  } catch (err) {
    console.error('S3 Delete Error:', err);
    throw new ApiError(500, 'file_005_02', 'An error occurred during file removal.');
  }
}

interface StartMultipartUploadParams {
  bucket?: ObjectBucketType;
  filePath: string;
  contentType: string;
  isPublic?: boolean;
}

/**
 * ============================================================================
 * @name    startMultipartUploadService
 * @code    file_010
 * @desc    Initializes a multipart upload and returns the UploadId.
 *
 * ============================================================================
 */
export async function startMultipartUploadService({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
  contentType,
  isPublic = false,
}: StartMultipartUploadParams) {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : undefined,
      CacheControl: buildCacheControl(isPublic),
    });
    const response = await s3Client.send(command);
    return response.UploadId;
  } catch (err) {
    throw new ApiError(500, 'file_010_01', 'Failed to start multipart upload.');
  }
}

interface GetMultipartPreSignedUrlParams {
  bucket?: ObjectBucketType;
  filePath: string;
  uploadId: string;
  partNumber: number;
}

/**
 * ============================================================================
 * @name    getMultipartPreSignedUrlService
 * @code    file_011
 * @desc    Generates a presigned URL for a specific chunk.
 *
 * ============================================================================
 */
export async function getMultipartPreSignedUrlService({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
  uploadId,
  partNumber,
}: GetMultipartPreSignedUrlParams) {
  try {
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: filePath,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    // The frontend has 1 hour to upload this specific chunk
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (err) {
    throw new ApiError(500, 'file_011_01', 'Failed to generate presigned URL for chunk.');
  }
}
interface CompleteMultipartUploadParams {
  bucket?: ObjectBucketType;
  filePath: string;
  uploadId: string;
  parts: { ETag: string; PartNumber: number }[];
}

/**
 * ============================================================================
 * @name    completeMultipartUploadService
 * @code    file_012
 * @desc    Tells S3 to stitch the chunks together.
 *
 * ============================================================================
 */
export async function completeMultipartUploadService({
  bucket = env.OBJECT_STORAGE_BUCKET,
  filePath,
  uploadId,
  parts,
}: CompleteMultipartUploadParams) {
  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: filePath,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber), // Must be in order
      },
    });
    await s3Client.send(command);
  } catch (err) {
    throw new ApiError(500, 'file_012_01', 'Failed to complete multipart upload.');
  }
}

/**
 * ============================================================================
 * @name    forceFixBucketCors
 * @code    -
 * @desc
 * - Run just once to fix the CORS setting of the bucket we want (e.g. the `OBJECT_STORAGE_BUCKET` bucket)
 * - TO use this function the key must be the all premission access.
 *
 * ============================================================================
 */
export async function forceFixBucketCors() {
  const bucket = env.OBJECT_STORAGE_BUCKET;

  const command = new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedHeaders: ['*'], // Next.js needs to send * up
          ExposeHeaders: ['ETag', 'etag'], // 🌟 THIS is the magic line the DO UI is missing!
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  try {
    await s3Client.send(command);
    console.log('✅ CORS successfully updated with Exposed Headers!');
  } catch (error) {
    console.error('❌ Failed to update CORS:', error);
  }
}
