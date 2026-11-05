import { FileTypeKey, ObjectBucketType } from '@/constants/storage.constants';
import { db } from '../db';
import { formatFileName } from './helpers/formatFileName.helper';
import { checkFileExistInS3Service, uploadFileToS3 } from './storage.service';
import { checkFileSize } from './helpers/checkFileSize.helper';
import { ApiError } from '../error/ApiError';
import { checkFileType } from './helpers/checkFileType.helper';
import { compressBufferImage } from './helpers/compressBufferImage.helper';
import { File } from '@/types/db';
import 'multer';
import { env } from '@/config/env';
import { auditCreate } from '@/utils/data/auditFields.helper';

interface UploadFileParams {
  bucketName?: ObjectBucketType;
  fileContent: Express.Multer.File;
  userLogName: string;
  filePath: string;
  fileCompressWidth?: number | null;
  fileCompressHeight?: number | null;
  fileSizeLimitInBytes?: number;
  fileTypeLimit?: FileTypeKey;
  isPublic?: boolean;
}

interface UploadFileResponse {
  fileId: string;
  fileUrl: string;
  metadata: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
}

/**
 * ============================================================================
 * @name    uploadFile
 * @code    file_006
 * @desc    Upload a file to S3 with validations and database logging.
 *
 * ============================================================================
 */
export async function uploadFile({
  bucketName = env.OBJECT_STORAGE_BUCKET,
  fileContent,
  userLogName,
  filePath,
  fileCompressWidth,
  fileCompressHeight,
  fileSizeLimitInBytes,
  fileTypeLimit,
  isPublic = false,
}: UploadFileParams): Promise<UploadFileResponse> {
  return db.transaction(async (trx) => {
    // Prepare file name and path
    const fileExtension = fileContent.originalname.split('.').pop() || '';
    const saveName = formatFileName({
      bucketName,
      filePath,
      fileExtension,
    });
    const fileUrl = saveName.fileUrlWithoutBucket;

    // Check if file already exists
    const fileExists = await checkFileExistInS3Service({ filePath: fileUrl });
    if (fileExists) {
      throw new ApiError(400, 'file_006_01', 'File already exists in storage.');
    }

    // Validate file size
    if (
      fileSizeLimitInBytes &&
      !checkFileSize({
        fileSizeInBytes: fileContent.size,
        limitSizeInBytes: fileSizeLimitInBytes,
      })
    ) {
      throw new ApiError(400, 'file_006_02', 'File size exceeds the limit.');
    }

    // Validate file type
    if (
      fileTypeLimit &&
      !checkFileType({
        mimetype: fileContent.mimetype,
        type: fileTypeLimit,
      })
    ) {
      throw new ApiError(400, 'file_006_03', 'File type is not allowed.');
    }

    // Compress image if needed
    let fileContentBuffer = fileContent.buffer;
    if (fileCompressWidth != null && fileCompressHeight != null) {
      if (!checkFileType({ mimetype: fileContent.mimetype, type: 'image' })) {
        throw new ApiError(400, 'file_006_04', 'File type is not allowed to compress.');
      }

      // 1. Call the helper. If it throws, the main 'catch' block will get it.
      fileContentBuffer = await compressBufferImage({
        inputBuffer: fileContent.buffer,
        options: {
          w: fileCompressWidth,
          h: fileCompressHeight,
        },
      });
    }

    const fileSize = fileContentBuffer.length;

    // ------ Start Log & edit db data action ------
    const newFileData: Partial<File> = {
      name: saveName.fileName,
      path: fileUrl,
      size: fileSize,
      type: fileContent.mimetype,
      fileExtension: fileExtension,
      isPublicFlag: isPublic,
      ...auditCreate(userLogName),
    };
    const [createdFileDB] = await trx('File').insert(newFileData).returning('fileId as fileId');
    if (!createdFileDB) {
      await trx.rollback();
      throw new ApiError(500, 'file_006_05', 'Failed to create file record in database.');
    }

    // ---- Save to S3 ----
    await uploadFileToS3({
      filePath: fileUrl,
      body: fileContentBuffer,
      contentType: fileContent.mimetype,
      isPublic: isPublic,
    });

    return {
      fileId: createdFileDB.fileId,
      fileUrl: fileUrl,
      metadata: {
        name: saveName.fileName,
        size: fileSize,
        type: fileContent.mimetype,
        extension: fileExtension,
      },
    };
  });
}
