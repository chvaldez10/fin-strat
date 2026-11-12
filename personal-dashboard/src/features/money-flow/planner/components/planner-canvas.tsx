"use client";

import { useCallback, type ReactNode } from "react";
import Link from "next/link";
import { CreditCard, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ElementToolbar } from "../../components/element-toolbar";
import { CanvasToolButton } from "../../components/canvas-tool-button";
import { projectMonthlyCanvas } from "../canvas-projection";
import type { PlannerLayoutValues } from "../use-planner-layout";
import type { FinancialAccount, Payment, PaymentKind } from "../types";
import { PlannerElementInspector } from "./planner-element-inspector";
import {
  PlannerCanvasFrame,
  type CanvasFrameState,
} from "./planner-canvas-frame";

import { MONEY_PATH, monthLink } from "../../routes";

const plannerTools = [
  { kind: "income", label: "Add income" },
  { kind: "expense", label: "Add expense" },
  { kind: "account", label: "Add savings or transfer" },
] as const;

export function PlannerCanvas({
  accountControl,
  summary,
  accounts,
  items,
  onAdd,
  ...frame
}: CanvasFrameState &
  Readonly<{
    accountControl?: ReactNode;
    summary?: ReactNode;
    accounts: FinancialAccount[];
    items: Payment[];
    onAdd: (kind: PaymentKind) => void;
  }>) {
  const { account, month } = frame;
  const project = useCallback(
    (positions: PlannerLayoutValues["positions"]) =>
      projectMonthlyCanvas(account, items, positions),
    [account, items]
  );
  return (
    <PlannerCanvasFrame
      {...frame}
      project={project}
      header={
        <div className="flex w-full min-w-0 items-center gap-1 sm:w-auto">
          <div className="min-w-0 flex-1 sm:flex-none">
            {accountControl ?? (
              <h1 className="mr-2 text-sm font-medium">{account.name}</h1>
            )}
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={monthLink(
                `${MONEY_PATH}/accounts/${encodeURIComponent(account.id)}`,
                month
              )}
              aria-label="Account details"
              title="Account details"
            >
              <Settings2 aria-hidden="true" />
            </Link>
          </Button>
        </div>
      }
      summary={summary}
      tools={(moveControl) => (
        <ElementToolbar
          tools={plannerTools}
          draggable={false}
          onAddElement={(kind) => {
            if (kind === "account") onAdd("savings");
            else if (kind === "income" || kind === "expense") onAdd(kind);
          }}
        >
          <CanvasToolButton
            label="Add credit card payment"
            onClick={() => onAdd("cardPayment")}
          >
            <CreditCard aria-hidden="true" />
          </CanvasToolButton>
          {moveControl}
        </ElementToolbar>
      )}
      inspect={(id, close) => {
        const group = items.filter(
          (item) =>
            item.accountId === account.id && (item.seriesId ?? item._id) === id
        );
        return group.length ? (
          <PlannerElementInspector
            items={group}
            accounts={accounts}
            month={month}
            onClose={close}
          />
        ) : null;
      }}
    />
  );
}
