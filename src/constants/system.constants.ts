// ============================================================================
// Action log
// ============================================================================

/**
 * @constant  actionLogType
 * @desc      List of supported action types in the action log.
 */
export const actionLogType = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;
export const actionLogTypeList = Object.values(actionLogType);
export type ActionLogType = (typeof actionLogTypeList)[number];

// ============================================================================
// Analytics
// ============================================================================

/**
 * @constant  aggregateType
 * @desc      List of aggregate analytic charts.
 */
export const aggregateType = {
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MIN: 'min',
  MAX: 'max',
} as const;
export const aggregateTypeList = Object.values(aggregateType);
export type AggregateType = (typeof aggregateTypeList)[number];

/**
 * @constant  intervalUnitType
 * @desc      List of interval unit analytic charts.
 */
export const intervalUnitType = {
  HOUR: 'hour',
  DAY: 'day',
  MONTH: 'month',
} as const;
export const intervalUnitList = Object.values(intervalUnitType);
export type IntervalUnitType = (typeof intervalUnitList)[number];
