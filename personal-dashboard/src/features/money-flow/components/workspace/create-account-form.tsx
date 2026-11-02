"use client";

import { useId, useState, type FormEvent } from "react";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { parseMoneyCents } from "../../amounts";
import { currentYearMonth, isYearMonth } from "../../months";
import type { YearMonth } from "../../types";

export type CreateAccountValues = {
  name: string;
  institution: string;
  accountType: "chequing" | "savings";
  openingBalanceCents: number;
  startMonth: YearMonth;
};

type CreateAccountFormProps = {
  onSubmit: (values: CreateAccountValues) => Promise<void>;
  onCancel?: () => void;
  /** Existing accounts share the plan's start month. Omit for a new plan. */
  planStartMonth?: YearMonth;
  className?: string;
};

export function CreateAccountForm({
  onSubmit,
  onCancel,
  planStartMonth,
  className,
}: CreateAccountFormProps) {
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [chosenMonth, setChosenMonth] = useState<string>(() =>
    currentYearMonth()
  );
  const month = planStartMonth ?? chosenMonth;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const balance = parseMoneyCents(String(data.get("balance")), {
      allowNegative: true,
    });
    const accountType = data.get("accountType");
    if (balance === null) {
      setError("Enter a valid balance with at most two decimal places.");
      return;
    }
    if (
      !isYearMonth(month) ||
      (accountType !== "chequing" && accountType !== "savings")
    ) {
      setError("Choose an account type and a valid plan start month.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onSubmit({
        name: String(data.get("name")).trim(),
        institution: String(data.get("institution")).trim(),
        accountType,
        openingBalanceCents: balance,
        startMonth: month,
      });
    } catch {
      setError(
        "Account could not be created. Your details are still here. Check your connection and try again."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className={cn(
        "m-4 w-auto max-w-2xl shrink-0 space-y-6 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6",
        className
      )}
      onSubmit={submit}
      aria-labelledby={`${id}-title`}
      aria-busy={pending}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
          <Landmark
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <div>
          <h2
            id={`${id}-title`}
            className="text-xl font-semibold tracking-tight"
          >
            Add a bank account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a planning workspace for one of your bank accounts.
          </p>
        </div>
      </div>
      <fieldset
        disabled={pending}
        className="grid min-w-0 gap-5 sm:grid-cols-2"
      >
        <legend className="sr-only">Account details</legend>
        <div className="space-y-2">
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Account name
          </label>
          <Input
            id={`${id}-name`}
            name="name"
            placeholder="Everyday chequing"
            required
            maxLength={120}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-institution`} className="text-sm font-medium">
            Institution
          </label>
          <Input
            id={`${id}-institution`}
            name="institution"
            placeholder="Your bank or credit union"
            required
            maxLength={120}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-type`} className="text-sm font-medium">
            Account type
          </label>
          <Select
            name="accountType"
            defaultValue="chequing"
            required
            disabled={pending}
          >
            <SelectTrigger id={`${id}-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chequing">Chequing</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-balance`} className="text-sm font-medium">
            Opening balance <span className="text-muted-foreground">(CAD)</span>
          </label>
          <Input
            id={`${id}-balance`}
            name="balance"
            inputMode="decimal"
            required
            defaultValue="0.00"
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-month`} className="text-sm font-medium">
            Plan start month
          </label>
          <MonthPicker
            id={`${id}-month`}
            name="month"
            value={month}
            onValueChange={setChosenMonth}
            disabled={pending || !!planStartMonth}
            aria-describedby={planStartMonth ? `${id}-month-help` : undefined}
          />
          {planStartMonth && (
            <p
              id={`${id}-month-help`}
              className="text-xs text-muted-foreground"
            >
              All accounts use your existing plan's start month.
            </p>
          )}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Use the balance from the start of your plan.
        </p>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {onCancel && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={onCancel}
              className="min-h-11 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={pending}
            className="min-h-11 flex-1 sm:flex-none"
          >
            {pending ? "Adding bank account..." : "Add bank account"}
          </Button>
        </div>
      </div>
    </form>
  );
}
