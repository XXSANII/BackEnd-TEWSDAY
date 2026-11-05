// ============================================================================
// Storage
// ============================================================================

/**
 * @constant  objectBucketType
 * @desc      List of S3 object buckets used in the application.
 */
export const objectBucketType = {
  TEWSDAY_DEV: 'tewsday-dev',
  TEWSDAY_PROD: 'tewsday-prod',
  MYAPP_DEV: 'myapp-dev',
  MYAPP_PROD: 'myapp-prod',
} as const;
export const objectBucketList = Object.values(objectBucketType);
export type ObjectBucketType = (typeof objectBucketList)[number];

/**
 * @constant  FileTypeMap
 * @desc      Mapping of file types to their corresponding MIME types.
 */
export const fileTypeMap = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  pdf: ['application/pdf'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

export type FileTypeMapObject = typeof fileTypeMap;

export type FileTypeKey = keyof FileTypeMapObject;
