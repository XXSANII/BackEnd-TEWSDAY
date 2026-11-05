/**
 * ============================================================================
 * @name    getAuthRedisKey
 * @desc    Helper to generate Redis key for authenticated user session data.
 *
 * ============================================================================
 */
export function getAuthRedisKey(token: string): string {
  return `tewsday:auth:${token}`;
}

/**
 * ============================================================================
 * @name    getTemplateRedisKey
 * @desc    Helper to generate Redis key for a template entity.
 *
 * ============================================================================
 */
export function getTemplateRedisKey(templateId: string): string {
  return `tewsday:template:${templateId}`;
}
