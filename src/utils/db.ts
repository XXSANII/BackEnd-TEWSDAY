import { env } from '@/config/env';
import knex from 'knex';
const dbConfig = require('../../knexfile');

// Determine environment
const dbEnv = env.NODE_ENV;
const config = dbConfig[dbEnv];

if (!config) {
  throw new Error(`Knex config for environment '${dbEnv}' not found.`);
}

/**
 * ============================================================================
 * @name    db
 * @desc    Database connection using Knex.js.
 *
 * ============================================================================
 */
export const db = knex(config);
