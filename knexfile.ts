import type { Knex } from 'knex';
import { env } from './src/config/env';
const fs = require('fs');
const path = require('path');

function getSslConfig() {
  if (env.NODE_ENV === 'production') {
    return {
      ca: fs.readFileSync(path.resolve(process.cwd(), 'ssl/root.crt')).toString(),
    };
  }
  return false;
}

const dbConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_HOST_PORT,
      user: env.DATABASE_USERNAME,
      password: env.DATABASE_USER_PASSWORD,
      database: env.DATABASE_NAME,
      ssl: false,
      keepAlive: true,
    },
    pool: {
      min: env.DATABASE_POOL_MIN ?? 0,
      max: env.DATABASE_POOL_MAX ?? 10,
      idleTimeoutMillis: 30000, // Up to 30 seconds (cause we have some long running queries)
    },
    acquireConnectionTimeout: 10000,
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },

  test: {
    client: 'pg',
    connection: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_HOST_PORT,
      user: env.DATABASE_USERNAME,
      password: env.DATABASE_USER_PASSWORD,
      database: env.DATABASE_NAME,
      ssl: false,
      keepAlive: true,
    },
    pool: {
      min: env.DATABASE_POOL_MIN ?? 0,
      max: env.DATABASE_POOL_MAX ?? 10,
      idleTimeoutMillis: 30000,
    },
    acquireConnectionTimeout: 10000,
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_HOST_PORT,
      user: env.DATABASE_USERNAME,
      password: env.DATABASE_USER_PASSWORD,
      database: env.DATABASE_NAME,
      ssl: false,
      keepAlive: true,
    },
    pool: {
      min: env.DATABASE_POOL_MIN ?? 2,
      max: env.DATABASE_POOL_MAX ?? 70,
      idleTimeoutMillis: 60000,
    },
    acquireConnectionTimeout: 10000,
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};

module.exports = dbConfig;
