import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logError } from '@/utils/error/logError';
import { ApiError } from '@/utils/error/ApiError';

/**
 * ============================================================================
 * @name    errorMiddleware
 * @desc
 * - Middleware to handle errors occurring in the application. And formats them into a consistent response structure.
 * - Defaults to a 500 Internal Server Error for unhandled exceptions.
 *
 * ============================================================================
 */
export function errorMiddleware(error: Error, req: Request, res: Response, next: NextFunction) {
  // Default values
  let statusCode = 500;
  let errorCode = 'int_999_01';
  let message: string | object = 'An unexpected error occurred.';

  // A flag to decide if we should log this
  let isSystemError = true;

  // This is for api errors we throw ourselves ----------------------
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;

    if (statusCode < 500) {
      isSystemError = false;
    }
  }
  // It's a validation error from Zod (User) ------------------------
  else if (error instanceof ZodError) {
    const firstError = error.issues[0];
    statusCode = 400;
    errorCode = firstError.message;
    message = error.issues;
    isSystemError = false;
  }

  // For system errors, log them to our logging system --------------
  if (isSystemError) {
    const apiName = (error as any).logCode || 'unknown_error_source';
    logError({
      apiName: apiName,
      req: req,
      error: error,
    });
  }

  // Send the response
  return res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: message,
  });
}
