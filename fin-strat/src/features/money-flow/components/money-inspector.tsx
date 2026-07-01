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
import { formatYearMonth } from "../months";
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
        key={selected.item.id}
        node={selected.item}
        startingBalanceCents={openingBalancesByNodeId[selected.item.id] ?? 0}
        isFirstMonth={isFirstMonth}
        onSave={onSaveNode}
      />
    ) : (
      <EdgeInspector
        key={selected.item.id}
        edge={selected.item}
        selectedMonth={selectedMonth}
        onSave={onSaveEdge}
      />
    );

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="max-h-[76vh] overflow-y-auto">
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
    <aside className="absolute inset-y-3 right-3 z-20 w-72 overflow-y-auto rounded-md border border-border bg-background shadow-md">
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

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsedStartingBalance = Number.parseFloat(startingBalance);

        onSave(node.id, {
          label: label.trim() || "Untitled",
          note: note.trim(),
          startingBalanceCents:
            node.data.kind === "chequing" &&
            isFirstMonth &&
            Number.isFinite(parsedStartingBalance)
              ? Math.round(parsedStartingBalance * 100)
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
          className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Optional context"
        />
      </Field>
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
    typeof existingOverride === "number" ? (existingOverride / 100).toString() : ""
  );
  const [startMonth, setStartMonth] = useState(edge.data?.startMonth ?? selectedMonth);
  const [endMonth, setEndMonth] = useState(edge.data?.endMonth ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsedBaseAmount = Number.parseFloat(baseAmount);
        const parsedOverride = Number.parseFloat(monthOverride);

        onSave(edge.id, {
          label: label.trim(),
          baseMonthlyAmountCents: Number.isFinite(parsedBaseAmount)
            ? Math.max(0, Math.round(parsedBaseAmount * 100))
            : 0,
          monthOverrideCents:
            monthOverride.trim() === ""
              ? null
              : Number.isFinite(parsedOverride)
                ? Math.max(0, Math.round(parsedOverride * 100))
                : null,
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
            type="month"
            value={startMonth}
            onChange={(event) => setStartMonth(event.target.value as YearMonth)}
          />
        </Field>
        <Field label="Ends" htmlFor="edge-end-month">
          <Input
            id="edge-end-month"
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
