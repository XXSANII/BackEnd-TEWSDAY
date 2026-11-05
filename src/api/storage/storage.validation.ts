import z from 'zod';

/**
 * ============================================================================
 * @name    createPresignedUploadSchema
 * @code    storage_001_c
 * @desc    Create presigned upload URL schema
 *
 * ============================================================================
 */
export const createPresignedUploadSchema = z.object({
  body: z.object({
    fileName: z.string('storage_001_c_v_01').min(1, 'storage_001_c_v_02').max(255, 'storage_001_c_v_02'),
    contentType: z.string('storage_001_c_v_03').min(1, 'storage_001_c_v_04').max(100, 'storage_001_c_v_04'),
    size: z.number('storage_001_c_v_05').int('storage_001_c_v_06').min(1, 'storage_001_c_v_06'),
    folder: z.string('storage_001_c_v_07').max(100, 'storage_001_c_v_07').optional(),
    isPublicFlag: z.boolean('storage_001_c_v_08').optional(),
  }),
});

export const createPresignedUploadResponseSchema = z.object({
  uploadUrl: z.string(),
  filePath: z.string(),
  expiresIn: z.number(),
});

export type CreatePresignedUploadInput = z.infer<typeof createPresignedUploadSchema>['body'];
export type CreatePresignedUploadResponse = z.infer<typeof createPresignedUploadResponseSchema>;

/**
 * ============================================================================
 * @name    confirmUploadSchema
 * @code    storage_002_c
 * @desc    Confirm uploaded file schema
 *
 * ============================================================================
 */
export const confirmUploadSchema = z.object({
  body: z.object({
    name: z.string('storage_002_c_v_01').min(1, 'storage_002_c_v_02').max(255, 'storage_002_c_v_02'),
    filePath: z.string('storage_002_c_v_03').min(1, 'storage_002_c_v_04'),
    size: z.number('storage_002_c_v_05').int('storage_002_c_v_06').min(1, 'storage_002_c_v_06'),
    type: z.string('storage_002_c_v_07').max(100, 'storage_002_c_v_07').optional().nullable(),
    fileExtension: z.string('storage_002_c_v_08').max(20, 'storage_002_c_v_08').optional().nullable(),
    isPublicFlag: z.boolean('storage_002_c_v_09').optional(),
  }),
});

export const confirmUploadResponseSchema = z.object({
  fileId: z.string(),
  path: z.string(),
  isPublicFlag: z.boolean(),
});

export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>['body'];
export type ConfirmUploadResponse = z.infer<typeof confirmUploadResponseSchema>;

/**
 * ============================================================================
 * @name    getFileViewUrlSchema
 * @code    storage_003_g
 * @desc    Get file view URL schema
 *
 * ============================================================================
 */
export const getFileViewUrlSchema = z.object({
  params: z.object({
    fileId: z.uuidv4('storage_003_g_v_01'),
  }),
});

export const getFileViewUrlResponseSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string().nullable(),
  isPublicFlag: z.boolean(),
  fileUrl: z.string(),
});

export type GetFileViewUrlParams = z.infer<typeof getFileViewUrlSchema>['params'];
export type GetFileViewUrlResponse = z.infer<typeof getFileViewUrlResponseSchema>;
