import type { YearMonth } from "./types";

export function currentYearMonth(date = new Date()): YearMonth {
  return toYearMonth(date.getFullYear(), date.getMonth() + 1);
}

export function addMonths(month: YearMonth, amount: number): YearMonth {
  const { year, monthNumber } = parseYearMonth(month);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return toYearMonth(date.getFullYear(), date.getMonth() + 1);
}

export function monthsBetween(start: YearMonth, end: YearMonth) {
  const startParts = parseYearMonth(start);
  const endParts = parseYearMonth(end);
  return (
    (endParts.year - startParts.year) * 12 +
    endParts.monthNumber -
    startParts.monthNumber
  );
}

export function enumerateMonths(start: YearMonth, count: number) {
  return Array.from({ length: Math.max(1, count) }, (_, index) =>
    addMonths(start, index)
  );
}

export function formatYearMonth(month: YearMonth, style: "long" | "short" = "long") {
  const { year, monthNumber } = parseYearMonth(month);
  return new Intl.DateTimeFormat("en-CA", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

export function compareYearMonth(left: YearMonth, right: YearMonth) {
  return monthsBetween(right, left);
}

function parseYearMonth(month: YearMonth) {
  const [year, monthNumber] = month.split("-").map(Number);
  return { year, monthNumber };
}

function toYearMonth(year: number, month: number): YearMonth {
  return `${year}-${month.toString().padStart(2, "0")}` as YearMonth;
}
