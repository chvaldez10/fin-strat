"use client";

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

type MonthPickerProps = Omit<
  ComponentProps<typeof Button>,
  "value" | "defaultValue" | "onChange" | "children" | "type" | "name"
> & {
  /** Controlled YYYY-MM value; an empty string displays the placeholder. */
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  locale?: string;
  contentClassName?: string;
};

function parseMonth(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value) || Number(value.slice(0, 4)) < 1)
    return null;
  return { year: Number(value.slice(0, 4)), month: Number(value.slice(5)) - 1 };
}

export function MonthPicker({
  value,
  onValueChange,
  name,
  placeholder = "Choose a month",
  locale = "en-CA",
  className,
  contentClassName,
  disabled,
  ...props
}: Readonly<MonthPickerProps>) {
  const selected = parseMonth(value);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(
    () => selected?.year ?? new Date().getFullYear()
  );
  const [focusedMonth, setFocusedMonth] = useState(selected?.month ?? 0);
  const monthRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const headingId = useId();
  const shortMonth = new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  });
  const fullMonth = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  });
  const label = selected
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}-01T00:00:00Z`))
    : placeholder;

  function handleOpenChange(next: boolean) {
    if (next && disabled) return;
    if (next) {
      setYear(selected?.year ?? new Date().getFullYear());
      setFocusedMonth(selected?.month ?? 0);
    }
    setOpen(next);
  }
  function handleMonthKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -3,
      ArrowDown: 3,
    };
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 11
          : event.key in offsets
            ? (index + offsets[event.key] + 12) % 12
            : null;
    if (next === null) return;
    event.preventDefault();
    monthRefs.current[next]?.focus();
  }

  return (
    <>
      {name && (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      )}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-h-11 w-full min-w-0 justify-start px-3 font-normal",
              !selected && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            {...props}
            type="button"
            data-slot="month-picker"
          >
            <CalendarDays
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-72", contentClassName)}
          aria-label="Choose month and year"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            monthRefs.current[focusedMonth]?.focus();
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous year"
              disabled={disabled || year <= 1}
              onClick={() => setYear((current) => current - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span id={headingId} className="font-semibold" aria-live="polite">
              {year}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next year"
              disabled={disabled || year >= 9999}
              onClick={() => setYear((current) => current + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <fieldset
            aria-labelledby={headingId}
            className="grid grid-cols-3 gap-1"
          >
            {Array.from({ length: 12 }, (_, month) => {
              const date = new Date(Date.UTC(2024, month, 1));
              const active =
                selected?.year === year && selected.month === month;
              return (
                <Button
                  key={month}
                  ref={(element) => {
                    monthRefs.current[month] = element;
                  }}
                  variant={active ? "default" : "ghost"}
                  disabled={disabled}
                  className="min-h-11"
                  aria-label={`${fullMonth.format(date)} ${year}`}
                  aria-pressed={active}
                  tabIndex={focusedMonth === month ? 0 : -1}
                  onFocus={() => setFocusedMonth(month)}
                  onKeyDown={(event) => handleMonthKey(event, month)}
                  onClick={() => {
                    onValueChange(
                      `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`
                    );
                    setOpen(false);
                  }}
                >
                  {shortMonth.format(date)}
                </Button>
              );
            })}
          </fieldset>
        </PopoverContent>
      </Popover>
    </>
  );
}
