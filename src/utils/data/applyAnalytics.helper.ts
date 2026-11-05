import { AggregateType, IntervalUnitType } from '@/constants/system.constants';
import { db } from '../db';

interface ApplyPeriodParams {
  query: any; // The query object to apply period

  // Date range query
  startDate?: string;
  endDate?: string;

  // Quick query
  daysAgo?: string;

  intervalUnit: IntervalUnitType; // Query unit to display (x axis)
  dateColumn: string; // Date time interested column (x axis)
  valueColumn: string; // Amount interested column (value)
  aggregateType?: AggregateType; // Aggregate type for calculate
}

/**
 * ============================================================================
 * @name    getBkkDateString
 * @desc    Helper to get date string formatted as 'YYYY-MM-DD' in Asia/Bangkok timezone.
 *
 * ============================================================================
 */
function getBkkDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * ============================================================================
 * @name    applyPeriod
 * @desc    Applies time period into analytics query with Asia/Bangkok timezone alignment.
 *
 * ============================================================================
 */
export function applyPeriod({
  query,
  startDate,
  endDate,
  daysAgo,
  intervalUnit = 'day',
  dateColumn,
  valueColumn,
  aggregateType = 'count',
}: ApplyPeriodParams) {
  const now = new Date();
  const todayBkkStr = getBkkDateString(now);

  let finalStartDateStr: string;
  let finalEndDateStr: string;

  // Determine start and end date boundaries in Asia/Bangkok time
  if (startDate && endDate) {
    finalStartDateStr = `${startDate} 00:00:00`;
    finalEndDateStr = `${endDate} 23:59:59`;
  } else if (startDate && !endDate) {
    finalStartDateStr = `${startDate} 00:00:00`;
    finalEndDateStr = `${todayBkkStr} 23:59:59`;
  } else {
    if (intervalUnit === 'hour') {
      const days = daysAgo ? Number(daysAgo) : 1;
      const targetDays = days > 0 ? days - 1 : 0;
      const startFrom = new Date(now.getTime() - targetDays * 24 * 60 * 60 * 1000);
      const startBkkStr = getBkkDateString(startFrom);

      finalStartDateStr = `${startBkkStr} 00:00:00`;
      finalEndDateStr = `${todayBkkStr} 23:59:59`;
    } else {
      const days = daysAgo ? Number(daysAgo) : 7;
      const targetDays = days > 0 ? days - 1 : 0;
      const startFrom = new Date(now.getTime() - targetDays * 24 * 60 * 60 * 1000);
      const startBkkStr = getBkkDateString(startFrom);

      finalStartDateStr = `${startBkkStr} 00:00:00`;
      finalEndDateStr = `${todayBkkStr} 23:59:59`;
    }
  }

  // Prepare aggregate function
  const aggFunction = aggregateType.toUpperCase();

  const cleanDateCol = dateColumn.replace(/"/g, '');
  const cleanValueCol = valueColumn.replace(/"/g, '');

  let displayFormat = 'YYYY-MM-DD';
  let stepInterval = '1 day';

  if (intervalUnit === 'hour') {
    displayFormat = 'YYYY-MM-DD HH24:00';
    stepInterval = '1 hour';
  } else if (intervalUnit === 'month') {
    displayFormat = 'YYYY-MM';
    stepInterval = '1 month';
  }

  // Config for specific time series period
  const seriesSql = `generate_series(
    date_trunc('${intervalUnit}', ?::timestamp), 
    date_trunc('${intervalUnit}', ?::timestamp), 
    '${stepInterval}'::interval
  )`;

  // Build time series query
  const seriesQuery = db
    .queryBuilder()
    .select(db.raw(`series_time as "seriesTime"`))
    .from(db.raw(`${seriesSql} as series_time`, [finalStartDateStr, finalEndDateStr]));

  // Build source subquery converting source timestamp to Asia/Bangkok
  const rawSubQuery = query
    .clone()
    .select([
      db.raw(`(?? AT TIME ZONE 'Asia/Bangkok') as "raw_date"`, [cleanDateCol]),
      db.raw('?? as "raw_value"', [cleanValueCol]),
    ])
    .whereRaw(`(?? AT TIME ZONE 'Asia/Bangkok') BETWEEN ?::timestamp AND ?::timestamp`, [
      cleanDateCol,
      finalStartDateStr,
      finalEndDateStr,
    ]);

  // Left join time series and original query
  const finalQuery = db
    .queryBuilder()
    .with('timeline_grid', seriesQuery)
    .with('source_data', rawSubQuery)
    .select([
      db.raw(`TO_CHAR(grid."seriesTime", '${displayFormat}') as "dateLabel"`),
      db.raw(`COALESCE(${aggFunction}(src."raw_value"), 0)::text as "value"`),
    ])
    .from('timeline_grid as grid')
    .leftJoin('source_data as src', db.raw(`date_trunc('${intervalUnit}', src."raw_date") = grid."seriesTime"`))
    .groupByRaw('grid."seriesTime"')
    .orderByRaw('grid."seriesTime" ASC');

  return finalQuery;
}
