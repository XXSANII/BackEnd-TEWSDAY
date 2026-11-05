/**
 * ============================================================================
 * @name    ApiError
 * @desc    Custom API Error class for handling API errors.
 *
 * ============================================================================
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

/**
 * ============================================================================
 * @name    AppError
 * @desc
 * - An `Error` carrying the `logCode` that `errorMiddleware` reads to identify which handler failed.
 * - Declaring it here is what removes the `(error as any)` cast that used to appear in every single controller catch
 *   block.
 *
 * ============================================================================
 */
export interface AppError extends Error {
  logCode?: string;
}
