import { Jimp } from 'jimp';

interface CompressOptions {
  w: number;
  h: number;
}

interface CompressBufferImageParams {
  inputBuffer: Buffer;
  options?: CompressOptions;
}

/**
 * ============================================================================
 * @name    compressBufferImage
 * @desc    Compress an image buffer to specified dimensions using Jimp.
 *
 * ============================================================================
 */
export async function compressBufferImage({ inputBuffer, options }: CompressBufferImageParams) {
  const compressOptions = options || { w: 800, h: 600 };

  const image = await Jimp.read(inputBuffer);
  if (!image) {
    throw new Error('Failed to read image from buffer');
  }

  image.cover(compressOptions);

  const mimeType = image?.mime || 'image/jpeg';

  const compressedBuffer = await image.getBuffer(mimeType as any);

  return compressedBuffer;
}
