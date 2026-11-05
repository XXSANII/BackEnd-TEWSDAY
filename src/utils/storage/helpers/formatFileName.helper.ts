import { ObjectBucketType } from '@/constants/storage.constants';
import { formatFileDate } from './formatFileDate.helper';
import { env } from '@/config/env';

interface FormatFileNameParams {
  bucketName?: ObjectBucketType;
  fileExtension: string;
  filePath: string;
}

/**
 * ============================================================================
 * @name    formatFileName
 * @desc    Format a file name based on the provided parameters.
 *
 * ============================================================================
 */
export function formatFileName({
  bucketName = env.OBJECT_STORAGE_BUCKET,
  filePath,
  fileExtension,
}: FormatFileNameParams) {
  // Ensure filePath ends with a slash
  if (!filePath.endsWith('/')) {
    filePath = filePath.replace(' ', '') + '/';
  }

  // Create the final file name
  const saveFileName = `${formatFileDate(new Date())}_${crypto.randomUUID()}`.replace(' ', '');
  const saveFileNameWithExtension = `${formatFileDate(new Date())}_${crypto.randomUUID()}.${fileExtension}`.replace(
    ' ',
    ''
  );
  const saveFilePath = `${filePath}${saveFileName}`;
  const saveFileUrl = `${bucketName}/${saveFilePath}`;

  return {
    fileUrl: saveFileUrl,
    fileUrlWithoutBucket: saveFilePath,
    filePath,
    fileName: saveFileNameWithExtension,
    fileNameWithoutExtension: saveFileName,
    fileExtension,
  };
}
