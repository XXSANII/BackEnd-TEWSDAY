import { FileTypeKey, fileTypeMap } from '@/constants/storage.constants';

interface CheckFileTypeParams {
  mimetype: string;
  type: FileTypeKey;
}

/**
 * ============================================================================
 * @name    checkFileType
 * @desc    Check if the provided mimetype matches the allowed types for the specified file type.
 *
 * ============================================================================
 */
export function checkFileType({ mimetype, type }: CheckFileTypeParams) {
  const allowedTypes = fileTypeMap[type];

  if (!allowedTypes) {
    return false;
  }

  return allowedTypes.includes(mimetype);
}
