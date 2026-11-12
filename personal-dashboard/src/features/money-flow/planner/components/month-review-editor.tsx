"use client";
import { useId, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { PlannerData } from "../use-planner";
import { PlannerSheet, FormError, usePlannerAction } from "./planner-form";
import { MoneyField as Field } from "../../components/money-field";
import { amountText, amountValue } from "../../amounts";

export function MonthReviewEditor({
  month,
  data,
  suggestion,
  onClose,
}: Readonly<{
  month: string;
  data: PlannerData;
  suggestion: number | null;
  onClose: () => void;
}>) {
  const reviewedId = useId();
  const [carryIn, setIn] = useState(amountText(data.carryInCents)),
    [carryOut, setOut] = useState(
      amountText(data.review?.carryOutCents ?? null)
    ),
    [closed, setClosed] = useState(data.review?.closed ?? false);
  const save = useMutation(api.moneyPlanner.saveReview),
    action = usePlannerAction();
  return (
    <PlannerSheet
      title="Review month and carryover"
      description="Confirm your actual cash for the month. Scheduled amounts are not a verified bank balance."
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(
            () =>
              save({
                month,
                expectedRevision: data.review?.revision ?? 0,
                carryInCents: amountValue(carryIn, true),
                carryOutCents: amountValue(carryOut, true),
                closed,
              }),
            onClose
          );
        }}
      >
        <fieldset disabled={action.busy} className="space-y-5">
          <legend className="sr-only">Monthly review</legend>
          <Field label="Confirmed cash carried into this month (CAD)">
            <Input
              aria-label="Cash carried in (CAD)"
              inputMode="decimal"
              value={carryIn}
              placeholder="Not confirmed"
              onChange={(e) => setIn(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the cash available at the start of this month. Payment
              completion is not tracked automatically.
            </p>
          </Field>
          <Field label="Confirmed cash to carry into next month (CAD)">
            <Input
              aria-label="Cash carried out (CAD)"
              inputMode="decimal"
              value={carryOut}
              placeholder="Not confirmed"
              onChange={(e) => setOut(e.target.value)}
            />
            {suggestion !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOut(amountText(suggestion))}
              >
                Use calculated estimate
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Check your actual cash before confirming. Money already moved to
              savings is not included automatically.
            </p>
          </Field>
          <label
            htmlFor={reviewedId}
            className="flex min-h-11 items-start gap-2 py-2 text-sm"
          >
            <Checkbox
              id={reviewedId}
              className="mt-0.5"
              checked={closed}
              onCheckedChange={(checked) => setClosed(checked === true)}
            />
            Month reviewed — preserve its planned payments. Uncheck to reopen
            and edit.
          </label>
          <FormError message={action.error} />
          <Button type="submit" className="w-full">
            {action.busy ? "Saving…" : "Save month review"}
          </Button>
        </fieldset>
      </form>
    </PlannerSheet>
  );
}
