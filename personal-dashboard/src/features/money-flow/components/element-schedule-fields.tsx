"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  calendarDate,
  formatDateOnly,
  parseDateOnly,
  type DateOnly,
} from "@/lib/date-only";
import type { MoneyFlowTransfer, YearMonth } from "../types";
import type { ElementScheduleValues } from "./element-editor-types";
type InitialSchedule = Pick<
  MoneyFlowTransfer,
  "startMonth" | "endMonth" | "startDate" | "endDate"
>;

export function useElementSchedule(
  initial: InitialSchedule | undefined,
  month: YearMonth
) {
  const [startDate, setStartDate] = useState<string>(
    initial?.startDate ?? `${initial?.startMonth ?? month}-01`
  );
  const [endDate, setEndDate] = useState<string>(() => {
    if (initial?.endDate) return initial.endDate;
    if (!initial?.endMonth) return "";
    const [year, monthNumber] = initial.endMonth.split("-").map(Number);
    return formatDateOnly(calendarDate(year, monthNumber, 0));
  });
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});
  return {
    startDate,
    endDate,
    errors,
    setStartDate: (value: string) => {
      setStartDate(value);
      setErrors({});
    },
    setEndDate: (value: string) => {
      setEndDate(value);
      setErrors({});
    },
    validate: (): ElementScheduleValues | null => {
      const next: typeof errors = {};
      if (!parseDateOnly(startDate)) next.start = "Choose a valid start date.";
      if (endDate && (!parseDateOnly(endDate) || endDate < startDate))
        next.end =
          "The end date must be the same as or later than the start date.";
      setErrors(next);
      return Object.keys(next).length
        ? null
        : {
            startDate: startDate as DateOnly,
            endDate: endDate ? (endDate as DateOnly) : undefined,
          };
    },
  };
}

export function ElementScheduleFields({
  schedule,
  idPrefix,
  disabled,
  onChange,
}: Readonly<{
  schedule: ReturnType<typeof useElementSchedule>;
  idPrefix: string;
  disabled: boolean;
  onChange: () => void;
}>) {
  const paymentDay = parseDateOnly(schedule.startDate)?.getUTCDate();
  return (
    <div className="grid gap-3">
      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-start-date`}
          className="text-sm font-medium"
        >
          Starts
        </label>
        <DatePicker
          id={`${idPrefix}-start-date`}
          value={schedule.startDate}
          disabled={disabled}
          aria-invalid={schedule.errors.start ? true : undefined}
          aria-describedby={
            schedule.errors.start
              ? `${idPrefix}-start-error`
              : `${idPrefix}-schedule-help`
          }
          onValueChange={(value) => {
            schedule.setStartDate(value);
            onChange();
          }}
        />
        {schedule.errors.start && (
          <p
            id={`${idPrefix}-start-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {schedule.errors.start}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor={`${idPrefix}-end-date`} className="text-sm font-medium">
          Ends <span className="text-muted-foreground">(optional)</span>
        </label>
        <DatePicker
          id={`${idPrefix}-end-date`}
          value={schedule.endDate}
          min={schedule.startDate}
          disabled={disabled}
          placeholder="No end date"
          clearable
          aria-invalid={schedule.errors.end ? true : undefined}
          aria-describedby={
            schedule.errors.end
              ? `${idPrefix}-end-error ${idPrefix}-end-help`
              : `${idPrefix}-end-help`
          }
          onValueChange={(value) => {
            schedule.setEndDate(value);
            onChange();
          }}
        />
        <p
          id={`${idPrefix}-end-help`}
          className="text-xs text-muted-foreground"
        >
          Leave empty to keep repeating each month.
        </p>
        {schedule.endDate && (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => {
              schedule.setEndDate("");
              onChange();
            }}
          >
            Remove end date
          </Button>
        )}
        {schedule.errors.end && (
          <p
            id={`${idPrefix}-end-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {schedule.errors.end}
          </p>
        )}
      </div>
      <p
        id={`${idPrefix}-schedule-help`}
        className="text-xs text-muted-foreground"
      >
        {paymentDay
          ? `Repeats monthly on day ${paymentDay}. Shorter months use their last day.`
          : "Choose the first payment date."}
      </p>
    </div>
  );
}
