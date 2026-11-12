"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MoneyCanvasNode } from "../canvas-types";
import type { MoneyFlowTransfer, YearMonth } from "../types";
import { amountText, parseMoneyCents } from "../amounts";
import { isFlowElement } from "../elements";
import type { ElementEditValues } from "./element-editor-types";
import { ElementFlowFields, useElementFlow } from "./element-flow-fields";
import { ElementSaveFeedback, useElementSave } from "./element-form-feedback";
import { MoneyField as ElementField } from "./money-field";

export function ElementDetailsForm({
  element,
  startingBalanceCents,
  isFirstMonth,
  primaryTransfer,
  selectedMonth,
  onSave,
  onRemoveTransfer,
}: Readonly<{
  element: MoneyCanvasNode;
  startingBalanceCents: number;
  isFirstMonth: boolean;
  primaryTransfer?: MoneyFlowTransfer;
  selectedMonth: YearMonth;
  onSave: (id: string, values: ElementEditValues) => Promise<boolean>;
  onRemoveTransfer: (id: string) => Promise<boolean>;
}>) {
  const [label, setLabel] = useState(element.data.label);
  const [note, setNote] = useState(element.data.note ?? "");
  const [balance, setBalance] = useState(amountText(startingBalanceCents));
  const [error, setError] = useState("");
  const flow = useElementFlow(primaryTransfer, selectedMonth);
  const save = useElementSave();
  const hasFlow = isFlowElement(element.data.kind);
  const kindLabel =
    element.data.kind === "account" ? "transfer" : element.data.kind;
  return (
    <form
      aria-busy={save.state === "saving"}
      onChange={save.reset}
      onSubmit={async (event) => {
        event.preventDefault();
        if (save.state === "saving") return;
        const cents = parseMoneyCents(balance, { allowNegative: true });
        if (
          element.data.kind === "chequing" &&
          isFirstMonth &&
          cents === null
        ) {
          setError(
            "Enter a valid starting balance with no more than two decimal places."
          );
          return;
        }
        setError("");
        const financial = hasFlow ? flow.validate() : null;
        if (hasFlow && !financial) return;
        await save.submit(() =>
          onSave(element.id, {
            label: label.trim() || "Untitled",
            note: note.trim(),
            startingBalanceCents:
              element.data.kind === "chequing" && isFirstMonth && cents !== null
                ? cents
                : undefined,
            flow: financial
              ? { ...financial, transferId: primaryTransfer?.id }
              : undefined,
          })
        );
      }}
    >
      <fieldset
        disabled={save.state === "saving"}
        className="min-w-0 space-y-5"
      >
        <legend className="sr-only">Element details</legend>
        <ElementField label="Label" htmlFor="node-label">
          <Input
            id="node-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={120}
          />
        </ElementField>
        {hasFlow && (
          <ElementFlowFields
            flow={flow}
            idPrefix={kindLabel}
            amountLabel={`Recurring monthly ${kindLabel} (CAD)`}
            month={selectedMonth}
            disabled={save.state === "saving"}
            onChange={save.reset}
          />
        )}
        {element.data.kind === "chequing" && (
          <ElementField label="Starting balance" htmlFor="starting-balance">
            <Input
              id="starting-balance"
              inputMode="decimal"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              disabled={!isFirstMonth}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "starting-balance-error" : undefined}
            />
            {!isFirstMonth && (
              <p className="text-xs text-muted-foreground">
                Carried forward from the previous month.
              </p>
            )}
            {error && (
              <p
                id="starting-balance-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </ElementField>
        )}
        <ElementField label="Note" htmlFor="node-note">
          <textarea
            id="node-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            placeholder="Optional context"
          />
        </ElementField>
        <ElementSaveFeedback
          state={save.state}
          label={hasFlow ? `Save ${kindLabel}` : "Save element"}
          confirmation={
            hasFlow
              ? `${kindLabel[0].toUpperCase()}${kindLabel.slice(1)} saved.`
              : "Element saved."
          }
        />
        {primaryTransfer && (
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() =>
              void save.submit(() => onRemoveTransfer(primaryTransfer.id))
            }
          >
            Remove connection
          </Button>
        )}
      </fieldset>
    </form>
  );
}
