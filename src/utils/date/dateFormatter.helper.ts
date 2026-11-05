// Combined data-time string -------------------------------------------------
export function combinedDateTime({
  date,
  time,
  hour,
  minute,
  second,
}: {
  date: string | Date;
  time?: string; // 'HH:mm:ss' format
  hour?: number;
  minute?: number;
  second?: number;
}) {
  const newDate = new Date(date.toString());

  if (time) {
    hour = parseInt(time.split(':')[0], 10);
    minute = parseInt(time.split(':')[1], 10);
    second = parseInt(time.split(':')[2], 10);
  }
  return new Date(newDate.setHours(hour || 0, minute || 0, second || 0));
}

// Format date string ---------------------------------------------------------------------------------------
export function formatDateEn(date?: string | Date | null, isLong?: boolean, isSecondIncluded?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: isLong ? 'long' : 'short',
    year: 'numeric',
  });
  return formattedDate;
}

export function formatDateTh(date?: string | Date | null, isLong?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: isLong ? 'long' : 'short',
    year: 'numeric',
  });
  return formattedDate;
}

export function formatDate(date?: string | Date | null) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  // Format the date to 'YYYY-MM-DD'
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so we add 1
  const day = String(newDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

// Format month year ----------------------------------------------------------------------------------------
export function formatMonthYearEn(date?: string | Date | null, isLong?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('en-US', {
    month: isLong ? 'long' : 'short',
    year: 'numeric',
  });
  return formattedDate;
}

export function formatMonthYearTh(date?: string | Date | null, isLong?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('th-TH', {
    month: isLong ? 'long' : 'short',
    year: 'numeric',
  });
  return formattedDate;
}

// Format month ---------------------------------------------------------------------------------------------

export function formatMonthEn(date?: string | Date | null, isLong?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('en-US', {
    month: isLong ? 'long' : 'short',
  });
  return formattedDate;
}

export function formatMonthTh(date?: string | Date | null, isLong?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('th-TH', {
    month: isLong ? 'long' : 'short',
  });
  return formattedDate;
}

// Format year ----------------------------------------------------------------------------------------------
export function formatYearEn(date?: string | Date | null) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('en-US', {
    year: 'numeric',
  });
  return formattedDate;
}

export function formatYearTh(date?: string | Date | null) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const formattedDate = newDate.toLocaleDateString('th-TH', {
    year: 'numeric',
  });
  return formattedDate;
}

// Format date time string ----------------------------------------------------------------------------------
export function formatDateTimeEn(date?: string | Date | null, isLong?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const datePart = newDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: isLong ? 'long' : 'short',
    year: 'numeric',
  });
  const timePart = newDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  });
  return `${datePart}, ${timePart}`;
}

export function formatDateTimeTh(date?: string | Date | null, isLong?: boolean) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  const datePart = newDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: isLong ? 'long' : 'short',
    year: 'numeric',
  });
  const timePart = newDate.toLocaleTimeString('th-TH', {
    hour: 'numeric',
    minute: 'numeric',
  });
  return `${datePart}, ${timePart}`;
}

// Format time string ---------------------------------------------------------------------------------------
export function formatTimeEn(date?: string | Date | null, isSecondIncluded: boolean = false) {
  if (!date) return '';
  const newDate = new Date(date.toString());
  return newDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    ...(isSecondIncluded && { second: 'numeric' }),
  });
}

export function formatTimeTh(date?: string | Date | null, isSecondIncluded: boolean = false) {
  if (!date) return '';
  const newDate = new Date(date.toString());
  return newDate.toLocaleTimeString('th-TH', {
    hour: 'numeric',
    minute: 'numeric',
    ...(isSecondIncluded && { second: 'numeric' }),
  });
}

// Format PG Date ----------------------------------------------------------------------------------

export function formatPgDate(date?: string | Date | null) {
  if (!date) return '';

  const newDate = new Date(date.toString());
  // Format the date to 'YYYY-MM-DD'
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so we add 1
  const day = String(newDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}
