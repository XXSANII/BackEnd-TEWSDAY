import z from 'zod';
import 'multer';

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface FileSchemaParams {
  // Behavior
  isRequired?: boolean;
  maxCount?: number;

  // Validation
  isCheckAcceptedTypes?: boolean;
  acceptedTypes?: string[]; // MIME types
  isCheckAcceptedSize?: boolean;
  maxSizeInBytes?: number;

  // Error Codes
  requiredError?: string;
  mimeTypeError?: string;
  sizeError?: string;
  countError?: string;
}

/**
 * ============================================================================
 * @name    createFileFieldSchema
 * @desc
 * - File schema for file validations.
 * - This function will return a zod schema for file validation.
 * - This function should allow dev to set the max file size and allowed mime types.
 *
 * ============================================================================
 */
export function createFileFieldSchema({
  isRequired = false,
  maxCount = 1,
  isCheckAcceptedTypes = true,
  acceptedTypes = DEFAULT_ACCEPTED_IMAGE_TYPES,
  isCheckAcceptedSize = true,
  maxSizeInBytes = DEFAULT_MAX_FILE_SIZE,
  requiredError = 'file_999_01', // 'File is required'
  mimeTypeError = 'file_999_02', // 'Invalid file type'
  sizeError = 'file_999_03', // 'File is too large'
  countError = 'file_999_04', // 'Too many files'
}: FileSchemaParams) {
  // Create the base schema for a single file object
  const fileSchema = z
    .object({
      mimetype: isCheckAcceptedTypes
        ? z.string().refine((mime) => acceptedTypes.includes(mime), {
            message: mimeTypeError,
          })
        : z.string(),
      size: isCheckAcceptedSize
        ? z.number().max(maxSizeInBytes, {
            message: sizeError,
          })
        : z.number(),
    })
    .loose();

  // Create the array schema
  const arraySchema = z.array(fileSchema).max(maxCount, {
    message: countError,
  });

  // Apply logic, THEN cast at the very end
  if (isRequired) {
    return arraySchema.min(1, { message: requiredError }) as unknown as z.ZodType<Express.Multer.File[]>;
  } else {
    return arraySchema.optional() as unknown as z.ZodType<Express.Multer.File[] | undefined>;
  }
}
