/**
 * ============================================================================
 * @name    validateTelNumber
 * @desc    Validates a telephone number.
 *
 * ============================================================================
 */
export function validateTelNumber(value: string): boolean {
  const telRegex = /^0\d{8,9}$/;
  return telRegex.test(value);
}
