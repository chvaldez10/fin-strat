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

export type SelectedMoneyElement =
  | { type: "node"; item: MoneyCanvasNode }
  | { type: "edge"; item: MoneyCanvasEdge }
  | null;

type MoneyInspectorProps = {
  selected: SelectedMoneyElement;
  startingBalanceCents: number;
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
    values: { label: string; monthlyAmountCents: number }
  ) => void;
};

export function MoneyInspector({
  selected,
  startingBalanceCents,
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
        startingBalanceCents={startingBalanceCents}
        onSave={onSaveNode}
      />
    ) : (
      <EdgeInspector
        key={selected.item.id}
        edge={selected.item}
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
  onSave,
}: {
  node: MoneyCanvasNode;
  startingBalanceCents: number;
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
              className="pl-9"
            />
          </div>
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
  onSave,
}: {
  edge: MoneyCanvasEdge;
  onSave: MoneyInspectorProps["onSaveEdge"];
}) {
  const [label, setLabel] = useState(edge.data?.label ?? "");
  const [amount, setAmount] = useState(
    ((edge.data?.monthlyAmountCents ?? 0) / 100).toString()
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsedAmount = Number.parseFloat(amount);

        onSave(edge.id, {
          label: label.trim(),
          monthlyAmountCents: Number.isFinite(parsedAmount)
            ? Math.max(0, Math.round(parsedAmount * 100))
            : 0,
        });
      }}
    >
      <Field label="Monthly amount" htmlFor="edge-amount">
        <div className="relative">
          <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="edge-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="pl-9"
          />
        </div>
      </Field>
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
