import { calendarDate, formatDateOnly } from "../../lib/date-only";
import { formatMoney } from "./calculations";

const shortDate = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function displayDate(value: string) {
  return shortDate.format(new Date(`${value}T00:00:00Z`));
}

export function localToday() {
  const value = new Date();
  return formatDateOnly(
    calendarDate(value.getFullYear(), value.getMonth(), value.getDate())
  );
}

export function paymentAmount(value: number | null) {
  return value === null ? "Not confirmed" : formatMoney(value);
}
