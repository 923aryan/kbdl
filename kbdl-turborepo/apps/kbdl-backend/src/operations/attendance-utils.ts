/** Format Prisma @db.Time value as HH:MM:SS (UTC). */
export function formatTimeOnly(value: Date | string): string {
  if (typeof value === 'string') {
    const match = value.match(/T(\d{2}:\d{2}:\d{2})/);
    if (match) return match[1]!;
    if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 8);
    return value;
  }
  return value.toISOString().slice(11, 19);
}

/** Parse YYYY-MM-DD to UTC midnight date. */
export function parseAttendanceDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Combine calendar date + HH:MM or HH:MM:SS into UTC timestamp. */
export function combineDateAndTime(dateStr: string, timeInput: string): Date {
  const normalized = timeInput.length === 5 ? `${timeInput}:00` : timeInput.slice(0, 8);
  return new Date(`${dateStr}T${normalized}.000Z`);
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h! * 60 + m!;
}

/** Build check-in/check-out from shift template on a given date (handles overnight shifts). */
export function shiftTemplateToRange(
  dateStr: string,
  startTime: Date | string,
  endTime: Date | string,
): { checkIn: Date; checkOut: Date } {
  const startStr = formatTimeOnly(startTime);
  const endStr = formatTimeOnly(endTime);
  const checkIn = combineDateAndTime(dateStr, startStr);
  let checkOut = combineDateAndTime(dateStr, endStr);
  if (timeToMinutes(endStr) <= timeToMinutes(startStr)) {
    checkOut = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000);
  }
  return { checkIn, checkOut };
}

export function computeWorkedMinutes(
  checkIn: Date,
  checkOut: Date,
  lunchBreakMinutes: number,
  teaBreakMinutes: number,
): number {
  const span = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000));
  return Math.max(0, span - lunchBreakMinutes - teaBreakMinutes);
}

export function formatMinutesAsHours(minutes: number): string {
  if (minutes <= 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h 0m`;
  return `${h}h ${m}m`;
}

export function formatTimeLog(checkIn: Date | null, checkOut: Date | null): string {
  if (!checkIn || !checkOut) return '-';
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  return `${fmt(checkIn)} - ${fmt(checkOut)}`;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Map DB attendance status to employer UI label. */
export function attendanceStatusLabel(status: string): string {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'half_day':
      return 'Half Day';
    case 'leave':
      return 'Leave';
    case 'week_off':
      return 'Week Off';
    case 'holiday':
      return 'Holiday';
    case 'on_duty':
      return 'On Duty';
    default:
      return status;
  }
}
