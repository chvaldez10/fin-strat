"use client";

import { memo } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
  NotebookPen,
  WalletCards,
} from "lucide-react";
import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../calculations";
import type { MoneyCanvasNode } from "../canvas-types";

const nodeStyles = {
  chequing: {
    icon: WalletCards,
    eyebrow: "Tracked account",
    className:
      "border-foreground bg-foreground text-background shadow-md ring-4 ring-foreground/10",
    handleClassName: "border-background! bg-foreground!",
  },
  income: {
    icon: ArrowDownToLine,
    eyebrow: "Income",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50",
    handleClassName: "border-emerald-50! bg-emerald-700!",
  },
  expense: {
    icon: ArrowUpFromLine,
    eyebrow: "Expense",
    className:
      "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-50",
    handleClassName: "border-rose-50! bg-rose-700!",
  },
  account: {
    icon: Landmark,
    eyebrow: "Account",
    className:
      "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-50",
    handleClassName: "border-sky-50! bg-sky-700!",
  },
  note: {
    icon: NotebookPen,
    eyebrow: "Note",
    className:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50",
    handleClassName: "",
  },
} as const;

export const MoneyNode = memo(function MoneyNode({
  data,
  selected,
}: NodeProps<MoneyCanvasNode>) {
  const style = nodeStyles[data.kind];
  const Icon = style.icon;
  const canReceive = data.kind !== "income" && data.kind !== "note";
  const canSend = data.kind !== "expense" && data.kind !== "note";

  return (
    <div
      className={cn(
        "w-52 rounded-md border p-3 transition-[border-color,box-shadow]",
        style.className,
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
      )}
    >
      {canReceive ? (
        <Handle
          type="target"
          position={Position.Left}
          className={cn("size-3! border-2!", style.handleClassName)}
        />
      ) : null}
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-current/15 bg-current/5">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] opacity-60">
            {style.eyebrow}
          </p>
          <p className="mt-1 truncate text-sm font-semibold">{data.label}</p>
          {data.kind === "chequing" &&
          typeof data.startingBalanceCents === "number" &&
          typeof data.projectedBalanceCents === "number" ? (
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-background/20 pt-2">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.12em] opacity-60">
                  Starting
                </p>
                <p className="mt-0.5 text-xs font-semibold">
                  {formatMoney(data.startingBalanceCents)}
                </p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.12em] opacity-60">
                  Projected
                </p>
                <p className="mt-0.5 text-xs font-semibold">
                  {formatMoney(data.projectedBalanceCents)}
                </p>
              </div>
            </div>
          ) : null}
          {data.note ? (
            <p className="mt-1 line-clamp-2 text-xs leading-4 opacity-65">
              {data.note}
            </p>
          ) : null}
        </div>
      </div>
      {canSend ? (
        <Handle
          type="source"
          position={Position.Right}
          className={cn("size-3! border-2!", style.handleClassName)}
        />
      ) : null}
    </div>
  );
});
