export function zodConvertToJsonPreProcess(val: unknown) {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

export function zodConvertToArrayPreProcess(val: unknown, splitBy: string = ',') {
  if (typeof val === 'string') {
    try {
      return val
        .split(splitBy)
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return val;
    }
  }
  return val;
}

export function zodConvertToBooleanPreProcess(val: unknown) {
  if (typeof val === 'string') {
    if (val === 'true') return true;
    if (val === 'false') return false;
  }
  return val;
}

export function zodConvertToNumberPreProcess(val: unknown) {
  if (typeof val === 'string') {
    return Number(val);
  }
  return val;
}

export function zodConvertToDatePreProcess(val: unknown) {
  if (typeof val === 'string') {
    return new Date(val);
  }
  return val;
}
