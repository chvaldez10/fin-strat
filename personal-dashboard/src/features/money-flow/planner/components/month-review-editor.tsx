"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlannerData } from "../use-planner";
import {
  PlannerSheet,
  Field,
  amountText,
  amountValue,
  FormError,
  usePlannerAction,
} from "./planner-form";

export function MonthReviewEditor({
  month,
  data,
  suggestion,
  onClose,
}: {
  month: string;
  data: PlannerData;
  suggestion: number | null;
  onClose: () => void;
}) {
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
      description="Confirm cash separately from unpaid bills. Estimates are not a verified bank balance."
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
              Include cash earmarked for unpaid bills. Those bills are deducted
              once in the planner.
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
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={closed}
              onChange={(e) => setClosed(e.target.checked)}
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
