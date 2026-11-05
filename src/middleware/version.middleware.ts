import { ApiError } from '@/utils/error/ApiError';
import { Request, Response, NextFunction } from 'express';

/**
 * ============================================================================
 * @name    versionMiddleware
 * @code    mid_001
 * @desc    Control the api version
 *
 * ============================================================================
 */
export function versionMiddleware(inputVersion: number) {
  return function (req: Request, res: Response, next: NextFunction) {
    // Remove the "v" and convert to number
    const { version } = req.params;
    if (typeof version !== 'string') {
      return next(new ApiError(400, 'mid_001_03', 'Invalid API version format.'));
    }

    let requestVersion = parseInt(version.substring(1));

    // If version is invalid or greater than or equal to the middleware version, proceed
    if (isNaN(requestVersion)) {
      return next(new ApiError(400, 'mid_001_01', 'Invalid API version requested.'));
    } else if (requestVersion >= inputVersion) {
      return next();
    } else {
      return next(
        new ApiError(404, 'mid_001_02', `API version v${inputVersion} or higher is required for this endpoint.`)
      );
    }
  };
}
