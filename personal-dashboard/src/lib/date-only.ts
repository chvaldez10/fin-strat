export type DateOnly = `${number}-${number}-${number}`;

/** Calendar dates use UTC fields only, so a timezone cannot change the day. */
export function calendarDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function formatDateOnly(date: Date): DateOnly {
  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}` as DateOnly;
}

export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = calendarDate(year, month - 1, day);
  return formatDateOnly(date) === value ? date : null;
}

export function daysInCalendarMonth(year: number, month: number) {
  return calendarDate(year, month + 1, 0).getUTCDate();
}

export function shiftCalendarMonth(date: Date, amount: number) {
  const next = calendarDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + amount,
    1
  );
  return calendarDate(
    next.getUTCFullYear(),
    next.getUTCMonth(),
    Math.min(
      date.getUTCDate(),
      daysInCalendarMonth(next.getUTCFullYear(), next.getUTCMonth())
    )
  );
}
