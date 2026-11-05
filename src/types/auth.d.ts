/**
 * @name  JwtTokenPayload
 * @type  Interface
 * @desc
 * - JWT Token Payload Interface
 * - Payload stored in JWT token
 */
export interface JwtTokenPayload {
  userId: string;
  sessionId: string;
}
