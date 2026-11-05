// Get the year options for select
export function getEnYearRangeOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 1900; i <= currentYear + 100; i++) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  return years;
}

export function getThYearRangeOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 1900; i <= currentYear + 100; i++) {
    years.push({ value: i.toString(), label: (i + 543).toString() });
  }
  return years;
}

// Get the month options for select
export function getEnMonthOptions(isLong?: boolean) {
  const months = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 12; i++) {
    // Create a date object for the 1st day of the target month 'i'
    const date = new Date(currentYear, i, 1);

    months.push({
      value: i.toString(),
      label: date.toLocaleDateString('en-GB', {
        month: isLong ? 'long' : 'short',
      }),
    });
  }
  return months;
}

export function getThMonthOptions(isLong?: boolean) {
  const months = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 12; i++) {
    // Create a date object for the 1st day of the target month 'i'
    const date = new Date(currentYear, i, 1);

    months.push({
      value: i.toString(),
      label: date.toLocaleDateString('th-TH', {
        month: isLong ? 'long' : 'short',
      }),
    });
  }
  return months;
}

export function getDateOptions() {
  const dates = [];
  for (let i = 1; i <= 31; i++) {
    dates.push({ value: i.toString(), label: i.toString() });
  }
  return dates;
}

// Date boundary helper functions -------------------------------------------

/**
 * ============================================================================
 * @name    getStartOfDay
 * @desc    Get start of day (00:00:00.000)
 *
 * ============================================================================
 */
export function getStartOfDay(date: Date | string = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * ============================================================================
 * @name    getEndOfDay
 * @desc    Get end of day (23:59:59.999)
 *
 * ============================================================================
 */
export function getEndOfDay(date: Date | string = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * ============================================================================
 * @name    getStartOfWeek
 * @desc
 * - Get start of week (Monday 00:00:00.000).
 * - Note: In JavaScript, Sunday is 0 and Monday is 1. This function assumes the week starts on Monday.
 *
 * ============================================================================
 */
export function getStartOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday is 1, Sunday is 0. If Sunday, diff is -6 days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * ============================================================================
 * @name    getEndOfWeek
 * @desc
 * - Get end of week (Sunday 23:59:59.999).
 * - Note: In JavaScript, Sunday is 0 and Saturday is 6. This function assumes the week ends on Sunday.
 *
 * ============================================================================
 */
export function getEndOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Sunday is 0, Saturday is 6. If Sunday, diff is 0 days.
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  const endOfWeek = new Date(d.setDate(diff));
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * ============================================================================
 * @name    getStartOfMonth
 * @desc    Get start of month (1st day 00:00:00.000)
 *
 * ============================================================================
 */
export function getStartOfMonth(date: Date | string = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * ============================================================================
 * @name    getEndOfMonth
 * @desc    Get end of month (last day 23:59:59.999)
 *
 * ============================================================================
 */
export function getEndOfMonth(date: Date | string = new Date()): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * ============================================================================
 * @name    getStartOfYear
 * @desc    Get start of year (Jan 1 00:00:00.000)
 *
 * ============================================================================
 */
export function getStartOfYear(date: Date | string = new Date()): Date {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * ============================================================================
 * @name    getEndOfYear
 * @desc    Get end of year (Dec 31 23:59:59.999)
 *
 * ============================================================================
 */
export function getEndOfYear(date: Date | string = new Date()): Date {
  const d = new Date(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}
