import { env } from '@/config/env';
import IORedis from 'ioredis';

/**
 * ============================================================================
 * @name    redis
 * @desc    Redis client connection using ioredis.
 *
 * ============================================================================
 */
export const redis = new IORedis({
  port: env.REDIS_PORT,
  host: env.REDIS_HOST,
  password: env.REDIS_PASSWORD,
});

redis.on('connect', () => console.log('[server] Redis client connected.'));
redis.on('error', (err) => console.error('Redis client error:', err));
