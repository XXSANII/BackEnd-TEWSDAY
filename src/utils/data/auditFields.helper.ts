/**
 * ============================================================================
 * @name    auditCreate
 * @desc
 * - Audit columns for a newly inserted row: marks it active and stamps both `createdBy` and `updatedBy` with the acting
 *   user.
 * - Spread into the insert payload, e.g. `{ name, ...auditCreate(user.userLogName) }`.
 * - Always set `updatedBy` on create. The database defaults it to `'system'`, so omitting it silently attributes the
 *   row to the system instead of the user.
 *
 * ============================================================================
 */
export function auditCreate(userLogName: string) {
  return {
    isActiveFlag: true,
    createdBy: userLogName,
    updatedBy: userLogName,
  };
}

/**
 * ============================================================================
 * @name    auditUpdate
 * @desc
 * - Audit columns for a mutation: stamps `updatedBy` and refreshes `updatedAt`.
 * - Spread last so it always wins over the incoming payload, e.g. `{ ...cleanUpdateData(input), ...auditUpdate(user.userLogName) }`.
 *
 * ============================================================================
 */
export function auditUpdate(userLogName: string) {
  return {
    updatedBy: userLogName,
    updatedAt: new Date(),
  };
}

/**
 * ============================================================================
 * @name    auditSoftDelete
 * @desc
 * - Audit columns for a soft delete. This codebase never issues a hard SQL `DELETE`; rows are retired by clearing
 *   `isActiveFlag`, and every read filters on `isActiveFlag: true`.
 * - Usage: `.update(auditSoftDelete(userPayload.userLogName))`.
 *
 * ============================================================================
 */
export function auditSoftDelete(userLogName: string) {
  return {
    isActiveFlag: false,
    updatedBy: userLogName,
    updatedAt: new Date(),
  };
}
