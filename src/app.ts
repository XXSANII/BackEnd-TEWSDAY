import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp'; // Protects against HTTP Parameter Pollution attacks
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';
import { ApiError } from './utils/error/ApiError';
import mainApiRouter from './api/api.routes';
import { env } from './config/env';
import { redis } from './utils/redis';
import { db } from './utils/db';
import { logError } from './utils/error/logError';

/**
 * ------------------------------------------------------------------------------------------------------
 * @Initialization
 * App Initialization and set up config
 */
const app: Express = express();
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

/**
 * CORS Configuration
 * - Allow the frontend application to communicate with this API
 *   - Using FRONTEND_HOST env variable for allowed origins
 *   - In the future for open APIs, consider using a more dynamic approach
 *     to allow multiple origins or use a whitelist.
 */
app.use(
  cors({
    origin: [
      // Allow specific origins with real domain, localgost, docker host
      env.FRONTEND_HOST || 'http://localhost:3000',
      'http://frontend:3001',
    ],
    credentials: true, // Allow cookies to be sent
  })
);

/**
 * Add cookie parser, security, and body parsing middlewares
 */
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(hpp());
// app.use(xss());

/**
 * Set up rate limiting middleware
 * - To protect against brute-force attacks and denial-of-service attacks
 * - Customize the options as per your requirements
 */
const allowlist: string[] = [];
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10000, // For development, set a high limit but in production, consider lowering this
});
app.use(limiter);

/**
 * ------------------------------------------------------------------------------------------------------
 * @Routes
 * Routes and API Endpoints
 */
app.use('/api/:version', mainApiRouter);

// Basic status check endpoint
app.get('/status-check', async (req: Request, res: Response) => {
  // Verify that the server can connect to Redis and the database
  await redis.ping();
  await db.raw('SELECT 1');

  res.status(200).json({
    success: true,
    message: 'All system healthy.',
    service: 'tewsday-api',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

/**
 * ------------------------------------------------------------------------------------------------------
 * @Error
 * Error Handling Middleware
 */
// Handle 404 errors for undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, 'int_999_02', 'The requested route does not exist.'));
  logError({
    apiName: '404 Not Found',
    req,
    error: new Error(`The requested route ${req.originalUrl} does not exist.`),
  });
});
app.use(errorMiddleware);

export default app;
