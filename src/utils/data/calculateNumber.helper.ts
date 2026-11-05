/**
 * ============================================================================
 * @name    roundAmount
 * @desc    Round a monetary value to 2 decimal places to avoid floating point drift.
 *
 * ============================================================================
 */
export function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * ============================================================================
 * @name    calculatePercentageChange
 * @desc
 * - Percentage change of the current value compared to the previous one.
 * - When there is no previous value, a positive current value counts as a full 100% growth.
 *
 * ============================================================================
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return roundAmount(((current - previous) / previous) * 100);
}
