import {
  calendarDate,
  daysInCalendarMonth,
  formatDateOnly,
  parseDateOnly,
} from "../../../lib/date-only";
import type { Schedule, PaymentValues } from "./types";

/** Generate a bounded month using calendar dates, never local-time arithmetic. */
export function schedulePayments(
  schedule: Schedule,
  month: string
): Array<{
  occurrenceKey: string;
  seriesId: string;
  originalDate: string;
  values: PaymentValues;
}> {
  const start = parseDateOnly(schedule.startDate);
  if (!start || schedule.status !== "active") return [];
  const [year, monthNumber] = month.split("-").map(Number);
  const dates = new Set<string>();
  const clamped = (day: number) =>
    formatDateOnly(
      calendarDate(
        year,
        monthNumber - 1,
        Math.min(day, daysInCalendarMonth(year, monthNumber - 1))
      )
    );
  const add = (day: number) => dates.add(clamped(day));
  switch (schedule.frequency) {
    case "once":
      if (schedule.startDate.startsWith(month)) dates.add(schedule.startDate);
      break;
    case "monthly":
      add(start.getUTCDate());
      break;
    case "twiceMonthly":
      add(start.getUTCDate());
      if (schedule.secondDay) add(schedule.secondDay);
      break;
    case "yearly":
      if (start.getUTCMonth() === monthNumber - 1) add(start.getUTCDate());
      break;
    default: {
      const interval = (schedule.frequency === "weekly" ? 7 : 14) * 86_400_000;
      const first = calendarDate(year, monthNumber - 1, 1).getTime();
      const end = calendarDate(year, monthNumber, 1).getTime();
      for (
        let time =
          start.getTime() +
          Math.max(0, Math.ceil((first - start.getTime()) / interval)) *
            interval;
        time < end;
        time += interval
      )
        dates.add(formatDateOnly(new Date(time)));
    }
  }
  const override = schedule.monthOverrides?.[month];
  if (override === null) return [];
  const candidates =
    schedule.frequency === "twiceMonthly"
      ? [
          { date: clamped(start.getUTCDate()), slot: "first" },
          { date: clamped(schedule.secondDay ?? 15), slot: "second" },
        ]
      : [...dates].map((date) => ({ date, slot: "" }));
  return candidates
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(
      ({ date }) =>
        date >= schedule.startDate &&
        date >= schedule.effectiveFrom &&
        (!schedule.effectiveTo || date < schedule.effectiveTo) &&
        (!schedule.endDate || date <= schedule.endDate)
    )
    .map(({ date: dueDate, slot }) => ({
      occurrenceKey: `${schedule.seriesId}:${dueDate}${slot ? `:${slot}` : ""}`,
      seriesId: schedule.seriesId,
      originalDate: dueDate,
      values: {
        name: schedule.name,
        kind: schedule.kind,
        isSubscription: schedule.isSubscription,
        amountCents: override ?? schedule.amountCents,
        estimated: schedule.estimated,
        accountId: schedule.accountId,
        counterpartyId: schedule.counterpartyId,
        dueDate,
        notes: schedule.notes,
        statementMonth: null,
        statementAmountCents: null,
      } satisfies PaymentValues,
    }));
}

export const FREQUENCIES = {
  once: "One time",
  weekly: "Every week",
  fortnightly: "Every two weeks",
  twiceMonthly: "Twice a month",
  monthly: "Every month",
  yearly: "Every year",
} as const;
export const PAYMENT_KINDS = {
  income: "Salary / income",
  expense: "Bill / expense",
  savings: "Savings / investment",
  transfer: "Account transfer",
  cardPayment: "Credit card payment",
} as const;
