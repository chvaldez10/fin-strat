"use client";

import { useState } from "react";
import { CircleDollarSign, Save, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MoneyCanvasEdge, MoneyCanvasNode } from "../canvas-types";
import { formatYearMonth, isYearMonth, monthsBetween } from "../months";
import { parseMoneyCents } from "../amounts";
import type { YearMonth } from "../types";

export type SelectedMoneyElement =
  | { type: "node"; item: MoneyCanvasNode }
  | { type: "edge"; item: MoneyCanvasEdge }
  | null;

type MoneyInspectorProps = {
  selected: SelectedMoneyElement;
  openingBalancesByNodeId: Record<string, number>;
  selectedMonth: YearMonth;
  isFirstMonth: boolean;
  onClose: () => void;
  onSaveNode: (
    id: string,
    values: {
      label: string;
      note: string;
      startingBalanceCents?: number;
    }
  ) => void;
  onSaveEdge: (
    id: string,
    values: {
      label: string;
      baseMonthlyAmountCents: number;
      monthOverrideCents: number | null;
      startMonth: YearMonth;
      endMonth?: YearMonth;
    }
  ) => void;
};

export function MoneyInspector({
  selected,
  openingBalancesByNodeId,
  selectedMonth,
  isFirstMonth,
  onClose,
  onSaveNode,
  onSaveEdge,
}: MoneyInspectorProps) {
  const isMobile = useIsMobile();

  if (!selected) {
    return null;
  }

  const content =
    selected.type === "node" ? (
      <NodeInspector
        key={`${selected.item.id}:${selectedMonth}`}
        node={selected.item}
        startingBalanceCents={openingBalancesByNodeId[selected.item.id] ?? 0}
        isFirstMonth={isFirstMonth}
        onSave={onSaveNode}
      />
    ) : (
      <EdgeInspector
        key={`${selected.item.id}:${selectedMonth}`}
        edge={selected.item}
        selectedMonth={selectedMonth}
        onSave={onSaveEdge}
      />
    );

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          data-testid="money-flow-inspector"
          className="max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle>
              {selected.type === "node" ? "Edit box" : "Edit money flow"}
            </SheetTitle>
            <SheetDescription>
              Changes update the monthly scenario when saved.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Money flow inspector"
      data-testid="money-flow-inspector"
      className="absolute inset-y-3 right-3 z-20 w-72 overflow-y-auto rounded-md border border-border bg-background shadow-md"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-semibold">
            {selected.type === "node" ? "Edit box" : "Edit money flow"}
          </p>
          <p className="text-xs text-muted-foreground">
            Saved changes update totals.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close inspector"
        >
          <X />
        </Button>
      </div>
      <div className="p-4">{content}</div>
    </aside>
  );
}

function NodeInspector({
  node,
  startingBalanceCents,
  isFirstMonth,
  onSave,
}: {
  node: MoneyCanvasNode;
  startingBalanceCents: number;
  isFirstMonth: boolean;
  onSave: MoneyInspectorProps["onSaveNode"];
}) {
  const [label, setLabel] = useState(node.data.label);
  const [note, setNote] = useState(node.data.note ?? "");
  const [startingBalance, setStartingBalance] = useState(
    (startingBalanceCents / 100).toString()
  );
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsedStartingBalance = parseMoneyCents(startingBalance, {
          allowNegative: true,
        });
        if (
          node.data.kind === "chequing" &&
          isFirstMonth &&
          parsedStartingBalance === null
        ) {
          setError(
            "Enter a valid starting balance with no more than two decimal places."
          );
          return;
        }
        setError(null);

        onSave(node.id, {
          label: label.trim() || "Untitled",
          note: note.trim(),
          startingBalanceCents:
            node.data.kind === "chequing" &&
            isFirstMonth &&
            parsedStartingBalance !== null
              ? parsedStartingBalance
              : undefined,
        });
      }}
    >
      <Field label="Label" htmlFor="node-label">
        <Input
          id="node-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </Field>
      {node.data.kind === "chequing" ? (
        <Field label="Starting balance" htmlFor="starting-balance">
          <div className="relative">
            <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="starting-balance"
              inputMode="decimal"
              value={startingBalance}
              onChange={(event) => setStartingBalance(event.target.value)}
              disabled={!isFirstMonth}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "starting-balance-error" : undefined}
              className="pl-9"
            />
          </div>
          {!isFirstMonth ? (
            <p className="text-xs text-muted-foreground">
              Carried forward from the previous month.
            </p>
          ) : null}
        </Field>
      ) : null}
      <Field label="Note" htmlFor="node-note">
        <textarea
          id="node-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
          placeholder="Optional context"
        />
      </Field>
      {error ? (
        <p
          id="starting-balance-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full">
        <Save />
        Save box
      </Button>
    </form>
  );
}

function EdgeInspector({
  edge,
  selectedMonth,
  onSave,
}: {
  edge: MoneyCanvasEdge;
  selectedMonth: YearMonth;
  onSave: MoneyInspectorProps["onSaveEdge"];
}) {
  const [label, setLabel] = useState(edge.data?.label ?? "");
  const [baseAmount, setBaseAmount] = useState(
    ((edge.data?.baseMonthlyAmountCents ?? 0) / 100).toString()
  );
  const existingOverride = edge.data?.monthOverrides?.[selectedMonth];
  const [monthOverride, setMonthOverride] = useState(
    typeof existingOverride === "number"
      ? (existingOverride / 100).toString()
      : ""
  );
  const [startMonth, setStartMonth] = useState(
    edge.data?.startMonth ?? selectedMonth
  );
  const [endMonth, setEndMonth] = useState(edge.data?.endMonth ?? "");
  const [errors, setErrors] = useState<
    Partial<Record<"amount" | "override" | "start" | "end", string>>
  >({});

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsedBaseAmount = parseMoneyCents(baseAmount);
        const parsedOverride =
          monthOverride.trim() === "" ? null : parseMoneyCents(monthOverride);
        const nextErrors: typeof errors = {};
        if (parsedBaseAmount === null)
          nextErrors.amount =
            "Enter a non-negative amount with no more than two decimal places.";
        if (monthOverride.trim() !== "" && parsedOverride === null)
          nextErrors.override =
            "Enter a valid override or leave it empty to use the recurring amount.";
        if (!isYearMonth(startMonth))
          nextErrors.start = "Choose a valid start month.";
        if (
          endMonth &&
          (!isYearMonth(endMonth) ||
            (isYearMonth(startMonth) &&
              monthsBetween(startMonth, endMonth) < 0))
        )
          nextErrors.end =
            "The end month must be the same as or later than the start month.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0 || parsedBaseAmount === null)
          return;

        onSave(edge.id, {
          label: label.trim(),
          baseMonthlyAmountCents: parsedBaseAmount,
          monthOverrideCents: parsedOverride,
          startMonth,
          endMonth: endMonth ? (endMonth as YearMonth) : undefined,
        });
      }}
    >
      <Field label="Recurring monthly amount" htmlFor="edge-amount">
        <div className="relative">
          <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="edge-amount"
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={errors.amount ? "edge-amount-error" : undefined}
            inputMode="decimal"
            value={baseAmount}
            onChange={(event) => setBaseAmount(event.target.value)}
            className="pl-9"
          />
        </div>
      </Field>
      <Field
        label={`${formatYearMonth(selectedMonth)} override`}
        htmlFor="edge-month-override"
      >
        <div className="relative">
          <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="edge-month-override"
            aria-invalid={errors.override ? true : undefined}
            aria-describedby={
              errors.override ? "edge-override-error" : undefined
            }
            inputMode="decimal"
            value={monthOverride}
            onChange={(event) => setMonthOverride(event.target.value)}
            className="pl-9"
            placeholder="Use recurring amount"
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" htmlFor="edge-start-month">
          <Input
            id="edge-start-month"
            aria-invalid={errors.start ? true : undefined}
            aria-describedby={errors.start ? "edge-start-error" : undefined}
            type="month"
            value={startMonth}
            onChange={(event) => setStartMonth(event.target.value as YearMonth)}
          />
        </Field>
        <Field label="Ends" htmlFor="edge-end-month">
          <Input
            id="edge-end-month"
            aria-invalid={errors.end ? true : undefined}
            aria-describedby={errors.end ? "edge-end-error" : undefined}
            type="month"
            value={endMonth}
            onChange={(event) => setEndMonth(event.target.value)}
          />
        </Field>
      </div>
      <Field label="Label" htmlFor="edge-label">
        <Input
          id="edge-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Optional, e.g. automatic transfer"
        />
      </Field>
      <div aria-live="polite" className="space-y-1">
        {Object.entries(errors).map(([field, message]) => (
          <p
            key={field}
            id={`edge-${field}-error`}
            className="text-sm text-destructive"
          >
            {message}
          </p>
        ))}
      </div>
      <Button type="submit" className="w-full">
        <Save />
        Save money flow
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
