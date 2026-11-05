import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '@/utils/error/ApiError';

/**
 * ============================================================================
 * @name    HandlerResponse
 * @desc    What a handler returns. `asyncHandler` turns it into the standard response envelope.
 *
 * ============================================================================
 */
export interface HandlerResponse<T = unknown> {
  message: string;
  data?: T;
  status?: number; // Default 200
}

/**
 * ============================================================================
 * @name    AsyncRequestHandler
 * @desc
 * - An Express handler that returns a promise.
 * - Return a `HandlerResponse` to send the standard envelope.
 * - Return nothing only when the handler already sent the response itself (redirect, file stream).
 *
 * ============================================================================
 */
type AsyncRequestHandler<T> = (req: Request, res: Response, next: NextFunction) => Promise<HandlerResponse<T> | void>;

/**
 * ============================================================================
 * @name    asyncHandler
 * @desc
 * - Wraps an async controller:
 * - Sends `{ success: true, code: '<code>_success', message, data }` from the returned `HandlerResponse`.
 * - Tags any error with `logCode = <code>` and forwards it to `errorMiddleware`.
 * - Removes the try/catch, `logCode` and `res.status().json()` from every controller.
 *
 * ============================================================================
 */
export function asyncHandler<T>(code: string, handler: AsyncRequestHandler<T>): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await handler(req, res, next);

      // Response already sent by the handler (redirect, file stream)
      if (res.headersSent) {
        return;
      }

      // If the handler returned nothing, it must be an error
      if (!response) {
        throw new Error(`Handler ${code} returned no response.`);
      }

      // Send the standard response envelope
      res.status(response.status ?? 200).json({
        success: true,
        code: `${code}_success`,
        message: response.message,
        data: response.data,
      });
    } catch (error) {
      // Pass the logCode to the error
      if (error instanceof Error && !(error as AppError).logCode) {
        (error as AppError).logCode = code;
      }
      next(error);
    }
  };
}
