import { Request } from 'express';
import { UserPayload } from '@/types/express';

/**
 * ============================================================================
 * @name    RequestPayloadMap
 * @desc    Payloads that middlewares attach to the request.
 *
 * ============================================================================
 */
interface RequestPayloadMap {
  user: UserPayload;
}
export type RequestPayloadKey = keyof RequestPayloadMap;

/**
 * ============================================================================
 * @name    getRequestPayload
 * @desc
 * - Get the payloads attached by middlewares, typed as non-null.
 * - Throws when one is missing. That means the route is missing a middleware, so it is a system error (500, logged).
 *
 * ============================================================================
 */
export function getRequestPayload<K extends RequestPayloadKey>(
  req: Request,
  keys: readonly K[]
): Pick<RequestPayloadMap, K> {
  const payload = {} as Pick<RequestPayloadMap, K>;
  const missingKeys: K[] = [];

  // Find the payloads in the request object
  for (const key of keys) {
    const value = req[key] as RequestPayloadMap[K] | undefined;
    if (!value) {
      missingKeys.push(key);
      continue;
    }
    payload[key] = value;
  }

  // If any payload is missing, throw an error
  if (missingKeys.length > 0) {
    throw new Error(`Request payload is missing: ${missingKeys.join(', ')}.`);
  }

  return payload;
}
