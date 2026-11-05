import { env } from '@/config/env';
import { S3Client } from '@aws-sdk/client-s3';

/**
 * ============================================================================
 * @name    s3Client
 * @desc    Object storage client using AWS SDK v3. Current configuration is connect to digital ocean spaces.
 *
 * ============================================================================
 */
export const s3Client = new S3Client({
  region: env.OBJECT_STORAGE_REGION,
  endpoint: env.OBJECT_STORAGE_ENDPOINT || undefined,
  credentials: {
    accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: env.OBJECT_STORAGE_FORCE_PATH_STYLE,
});
