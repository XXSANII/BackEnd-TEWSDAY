import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes
const TAG_LENGTH = 16; // 16 bytes

/**
 * ============================================================================
 * @name    encryptData
 * @code    -
 * @desc    Encrypts data using AES-256-GCM.
 *
 * ============================================================================
 */
export function encryptData(data: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Drop JSON. Just join ID and Time with a pipe '|'
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);

  const tag = cipher.getAuthTag();

  // Combine all parts into one Buffer and use Base64
  // Format: [ IV (12) ] + [ Encrypted Data (...) ] + [ Auth Tag (16) ]
  const finalBuffer = Buffer.concat([iv, encrypted, tag]);

  return finalBuffer.toString('base64');
}

/**
 * ============================================================================
 * @name    decryptData
 * @code    -
 * @desc    Decrypts data using AES-256-GCM.
 *
 * ============================================================================
 */
export function decryptData(data: string, keyHex: string) {
  const key = Buffer.from(keyHex, 'hex');

  // Convert Base64 back to raw binary
  const buffer = Buffer.from(data, 'base64');

  // Extract the parts based on known lengths
  // IV is always the first 12 bytes
  const iv = buffer.subarray(0, IV_LENGTH);

  // Tag is always the last 16 bytes
  const tag = buffer.subarray(buffer.length - TAG_LENGTH);

  // Encrypted data is everything in between
  const encrypted = buffer.subarray(IV_LENGTH, buffer.length - TAG_LENGTH);

  // Decrypt
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decryptedText = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  return decryptedText;
}

// Example usage:
/**
  import crypto from 'crypto';
  const secretKey = crypto.randomBytes(32).toString('hex');
  const test = `5d23be74-d28b-4356-9db2-cdd3de77ef24|${new Date().getTime()}`;
  console.log(test);

  const encryptData = encryptData(test, secretKey);
  console.log(encryptData);
  
  const decryptData = decryptData(encryptData, secretKey);
  console.log(decryptData);
 */
