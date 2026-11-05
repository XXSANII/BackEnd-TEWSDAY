interface CheckFileSizeParams {
  fileSizeInBytes: number;
  limitSizeInBytes: number;
}

/**
 * ============================================================================
 * @name    checkFileSize
 * @desc    Check if the file size exceed the limit
 *
 * ============================================================================
 */
export function checkFileSize({ fileSizeInBytes, limitSizeInBytes }: CheckFileSizeParams) {
  if (fileSizeInBytes > limitSizeInBytes) {
    return false;
  } else {
    return true;
  }
}
