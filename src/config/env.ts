import 'dotenv/config';
import { z } from 'zod';
import type { ObjectBucketType } from '../constants/storage.constants';

/**
 * ============================================================================
 * @name    env
 * @desc
 * - The ONLY place that reads `process.env`. Everything else imports `env` from here.
 * - Only values that change per environment (hosts, credentials, bucket names) live here.
 *   Fixed values (vendor API urls, token lifetimes, file size limits) live in `app.config.ts`.
 * - Values are parsed once at startup: numbers are numbers, booleans are booleans, defaults are applied.
 *
 * ============================================================================
 */

// "true" / "false" string to boolean (z.coerce.boolean would turn "false" into true)
const booleanString = (defaultValue: boolean) =>
  z
    .enum(['true', 'false'])
    .default(defaultValue ? 'true' : 'false')
    .transform((value) => value === 'true');

const envSchema = z.object({
  // Application Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('http://localhost'),
  PORT: z.coerce.number().int().default(5001),
  ENABLE_CRON_JOBS: booleanString(false),

  // Another Services Hosts
  FRONTEND_HOST: z.string().default('http://localhost:3000'),

  // Database Configuration
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_HOST_PORT: z.coerce.number().int().default(5432),
  DATABASE_USERNAME: z.string().default('postgres'),
  DATABASE_USER_PASSWORD: z.string().default(''),
  DATABASE_NAME: z.string().default(''),
  DATABASE_POOL_MIN: z.coerce.number().int().optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().optional(),

  // Redis Configuration
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Object and Bucket Storage Configuration
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().default(''),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().default(''),
  OBJECT_STORAGE_REGION: z.string().default('us-east-1'),
  OBJECT_STORAGE_FORCE_PATH_STYLE: booleanString(false),
  OBJECT_STORAGE_BUCKET: z
    .string()
    .default('tewsday-dev')
    .transform((value) => value as ObjectBucketType),
  OBJECT_STORAGE_BUCKET_ENDPOINT: z.string().default(''),

  // JWT Configuration
  JWT_SECRET: z.string().default(''),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email Configuration (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_USER: z.string().optional(), // Gmail fallback
  GOOGLE_APP_PASSWORD: z.string().optional(),

  // AI Embedding Configuration
  EMBEDDING_API_URL: z.string().optional(),
  EMBEDDING_API_KEY: z.string().optional(),

  // Platform Payee
  PLATFORM_PAYEE_USER_ID: z.string().default(''),

  // File Handling Configuration
  FILE_HIDDEN_STRING_ENCRYPTION_KEY: z.string().default(''),

});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`[config] Invalid environment variables:\n${issues}`);
}

export const env = parsedEnv.data;

export const isProduction = env.NODE_ENV === 'production';

/**
 * @name    assertRequiredEnv
 * @desc
 * - Fail fast on startup when a value the server cannot run without is missing.
 * - Called by `server.ts` only, so tools that import the config (knex CLI, scripts) still work without them.
 */
export function assertRequiredEnv() {
  const requiredKeys = ['JWT_SECRET', 'DATABASE_HOST', 'DATABASE_USERNAME', 'DATABASE_NAME'] as const;
  const missingKeys = requiredKeys.filter((key) => !env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`[config] Missing required environment variables: ${missingKeys.join(', ')}`);
  }
}
