import 'multer';

/**
 * ============================================================================
 * @name    getFileSize
 * @desc    Get file size in bytes from a Buffer or string.
 *
 * ============================================================================
 */

export function getFileSize(file: Express.Multer.File): number {
  return file.size;
}
