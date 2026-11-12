"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "../calculations";
import type { MoneyCanvasNode } from "../canvas-types";
import { ELEMENT_PRESENTATION } from "./element-presentation";

export const MoneyElement = memo(function MoneyElement({
  id,
  data,
  selected,
}: Readonly<NodeProps<MoneyCanvasNode>>) {
  const creditCard = data.variant === "credit-card";
  const expenseAccount = creditCard || data.variant === "debit-account";
  const presentation =
    ELEMENT_PRESENTATION[expenseAccount ? "expense" : data.kind];
  const Icon = creditCard ? CreditCard : presentation.icon;
  const tracked = data.kind === "chequing";
  const note = data.kind === "note";
  return (
    <div
      data-testid={`money-flow-node-${id}`}
      className={cn(
        "group w-52 rounded-2xl border bg-card p-3 text-card-foreground shadow-sm transition-[border-color,box-shadow] hover:shadow-md md:w-60 md:p-4",
        presentation.border,
        tracked &&
          "w-60 border-foreground/15 bg-foreground text-background shadow-lg shadow-black/10 md:w-72",
        selected &&
          "ring-2 ring-ring ring-offset-4 ring-offset-background shadow-md"
      )}
    >
      {!note && !expenseAccount && data.kind !== "income" && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "size-3! border-[3px]! border-card!",
            presentation.handle
          )}
        />
      )}
      <div className="flex items-start gap-2 md:gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl md:size-10",
            tracked ? "bg-background/10 text-background" : presentation.accent
          )}
        >
          <Icon className="size-4 md:size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[0.65rem] font-medium uppercase tracking-[0.12em]",
              tracked ? "text-background/60" : "text-muted-foreground"
            )}
          >
            {data.caption ?? presentation.label}
          </p>
          <p
            className="mt-1 line-clamp-2 wrap-anywhere text-sm font-semibold tracking-tight"
            title={data.label}
          >
            {data.label}
          </p>
        </div>
      </div>
      {tracked &&
        typeof data.startingBalanceCents === "number" &&
        typeof data.projectedBalanceCents === "number" && (
          <div className="mt-5 space-y-3">
            <div>
              <p className="text-xs text-background/60">Projected balance</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {formatMoney(data.projectedBalanceCents)}
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-background/15 pt-3 text-xs">
              <span className="text-background/60">Opening balance</span>
              <span className="font-medium tabular-nums">
                {formatMoney(data.startingBalanceCents)}
              </span>
            </div>
          </div>
        )}
      {!tracked && !note && (
        <div className="mt-3 md:mt-5">
          <p
            className={cn(
              "wrap-anywhere text-xl font-semibold tracking-tight tabular-nums md:text-2xl",
              typeof data.monthlyAmountCents !== "number" &&
                "text-base text-muted-foreground"
            )}
          >
            {typeof data.monthlyAmountCents === "number"
              ? formatMoney(data.monthlyAmountCents)
              : "Set an amount"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.amountCaption ??
              (data.active === false
                ? "Not scheduled this month"
                : data.paymentDay
                  ? `Monthly · Day ${data.paymentDay}`
                  : "Monthly cash flow")}
            {(data.connectionCount ?? 0) > 1
              ? ` · ${data.connectionCount} connections`
              : ""}
          </p>
        </div>
      )}
      {data.note && (
        <p
          className={cn(
            "mt-3 line-clamp-3 wrap-anywhere text-xs leading-relaxed",
            tracked ? "text-background/65" : "text-muted-foreground"
          )}
        >
          {data.note}
        </p>
      )}
      {!note &&
        !expenseAccount &&
        (data.kind !== "expense" || data.showOutput) && (
          <Handle
            type="source"
            position={Position.Right}
            className={cn(
              "size-3! border-[3px]! border-card!",
              presentation.handle
            )}
          />
        )}
    </div>
  );
});
