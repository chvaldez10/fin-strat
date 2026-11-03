"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  calendarDate,
  daysInCalendarMonth,
  formatDateOnly,
  parseDateOnly,
  shiftCalendarMonth,
} from "@/lib/date-only";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type DatePickerProps = Omit<
  ComponentProps<typeof Button>,
  "value" | "defaultValue" | "onChange" | "children" | "type" | "name"
> & {
  /** Controlled YYYY-MM-DD value. An empty string displays the placeholder. */
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  locale?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
  contentClassName?: string;
};

function today() {
  const date = new Date();
  return calendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function DatePicker({
  value,
  onValueChange,
  name,
  placeholder = "Choose a date",
  locale = "en-CA",
  min,
  max,
  clearable = false,
  className,
  contentClassName,
  disabled,
  ...props
}: DatePickerProps) {
  const selected = parseDateOnly(value);
  const minimum = parseDateOnly(min);
  const maximum = parseDateOnly(max);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selected ?? today());
  const [focused, setFocused] = useState(() =>
    formatDateOnly(selected ?? today())
  );
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusPending = useRef(false);
  const headingId = useId();
  const year = view.getUTCFullYear(),
    month = view.getUTCMonth();
  const first = calendarDate(year, month, 1);
  const dayCount = daysInCalendarMonth(year, month);
  const cellCount = Math.ceil((first.getUTCDay() + dayCount) / 7) * 7;
  const dayLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "UTC",
  });
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const weekdayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const inRange = (date: Date) =>
    date.getUTCFullYear() >= 1 &&
    date.getUTCFullYear() <= 9999 &&
    (!minimum || date >= minimum) &&
    (!maximum || date <= maximum);

  useEffect(() => {
    if (open && focusPending.current) {
      dayRefs.current.get(focused)?.focus();
      focusPending.current = false;
    }
  }, [open, focused, view]);

  function openChanged(next: boolean) {
    if (next && disabled) return;
    if (next) {
      let initial = selected ?? today();
      if (minimum && initial < minimum) initial = minimum;
      if (maximum && initial > maximum) initial = maximum;
      setView(initial);
      setFocused(formatDateOnly(initial));
    }
    setOpen(next);
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -date.getUTCDay(),
      End: 6 - date.getUTCDay(),
    };
    let next: Date;
    if (event.key in offsets)
      next = calendarDate(year, month, date.getUTCDate() + offsets[event.key]);
    else if (event.key === "PageUp" || event.key === "PageDown")
      next = shiftCalendarMonth(
        date,
        (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1)
      );
    else return;
    event.preventDefault();
    if (minimum && next < minimum) next = minimum;
    if (maximum && next > maximum) next = maximum;
    if (!inRange(next)) return;
    focusPending.current = true;
    setView(next);
    setFocused(formatDateOnly(next));
  }

  function changeMonth(amount: number) {
    let next = shiftCalendarMonth(view, amount);
    if (minimum && next < minimum) next = minimum;
    if (maximum && next > maximum) next = maximum;
    setView(next);
    setFocused(formatDateOnly(next));
  }

  return (
    <>
      {name && (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      )}
      <Popover open={open} onOpenChange={openChanged}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            {...props}
            type="button"
            disabled={disabled}
            data-slot="date-picker"
            className={cn(
              "min-h-11 w-full min-w-0 justify-start px-3 font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <CalendarDays
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate">
              {selected
                ? new Intl.DateTimeFormat(locale, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(selected)
                : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-[22rem] p-3", contentClassName)}
          aria-label="Choose a date"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            dayRefs.current.get(focused)?.focus();
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous month"
              disabled={
                disabled ||
                (year === 1 && month === 0) ||
                (!!minimum && calendarDate(year, month, 0) < minimum)
              }
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span
              id={headingId}
              className="text-sm font-semibold"
              aria-live="polite"
            >
              {monthLabel.format(first)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next month"
              disabled={
                disabled ||
                (year === 9999 && month === 11) ||
                (!!maximum && calendarDate(year, month + 1, 1) > maximum)
              }
              onClick={() => changeMonth(1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <table
            className="w-full table-fixed border-collapse"
            aria-labelledby={headingId}
          >
            <thead>
              <tr>
                {Array.from({ length: 7 }, (_, day) => (
                  <th
                    key={day}
                    scope="col"
                    className="h-8 text-center text-xs font-normal text-muted-foreground"
                  >
                    {weekdayLabel.format(calendarDate(2026, 10, 1 + day))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cellCount / 7 }, (_, row) => (
                <tr key={row}>
                  {Array.from({ length: 7 }, (_, col) => {
                    const day = row * 7 + col - first.getUTCDay() + 1;
                    if (day < 1 || day > dayCount)
                      return <td key={col} aria-hidden="true" />;
                    const date = calendarDate(year, month, day),
                      iso = formatDateOnly(date);
                    return (
                      <td key={col} className="p-0.5">
                        <Button
                          ref={(element) => {
                            if (element) dayRefs.current.set(iso, element);
                            else dayRefs.current.delete(iso);
                          }}
                          variant={iso === value ? "default" : "ghost"}
                          className="min-h-11 w-full px-0"
                          disabled={disabled || !inRange(date)}
                          aria-label={dayLabel.format(date)}
                          aria-pressed={iso === value}
                          tabIndex={iso === focused ? 0 : -1}
                          onFocus={() => setFocused(iso)}
                          onKeyDown={(event) => keyDown(event, date)}
                          onClick={() => {
                            onValueChange(iso);
                            setOpen(false);
                          }}
                        >
                          {day}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {clearable && (
            <Button
              variant="ghost"
              className="mt-2 w-full"
              disabled={disabled || !selected}
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              Clear selection
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
