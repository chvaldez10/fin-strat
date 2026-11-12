"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { AccountSwitcher } from "../../components/account-switcher";
import { MoneyFlowLoading } from "../../components/money-flow-loading";
import { usePlanner, usePlannerMetadata } from "../use-planner";
import { useCanvasAccount } from "../use-canvas-account";
import { MONEY_PATH, monthLink } from "../../routes";
import { PlannerCanvasPage } from "./planner-canvas-page";
import { PlannerLoading } from "./planner-shell";

import { AccountEditor } from "./account-editor";

export function CanvasHomePage() {
  const planner = usePlanner(),
    legacy = usePlannerMetadata(),
    choice = useCanvasAccount();
  const [adding, setAdding] = useState(false);
  const banks = legacy.accounts.map((account) => {
    const current = planner.data?.accounts.find(
      (item) => item.id === account.id
    );
    return {
      ...account,
      name: current?.name ?? account.name,
      institution: current?.institution ?? account.institution,
    };
  });
  const preferred = choice.accountId || legacy.root?.view.selectedAccountId;
  const selected =
    banks.find((account) => account.id === preferred) ?? banks[0];
  if (legacy.isLoading || (!selected && !planner.data?.ready))
    return planner.error ? (
      <PlannerLoading error={planner.error} onRetry={planner.retry} />
    ) : (
      <MoneyFlowLoading />
    );
  if (!selected)
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <EmptyState
          title="Start your monthly canvas"
          description="Add a bank account to place income, expenses, savings and credit-card payments on your canvas."
          action={
            <Button onClick={() => setAdding(true)}>Add bank account</Button>
          }
        />
        <Button variant="outline" asChild>
          <Link href={monthLink(`${MONEY_PATH}/planner`, planner.month)}>
            Monthly plan
          </Link>
        </Button>
        {adding && (
          <AccountEditor
            month={planner.month}
            onClose={() => setAdding(false)}
          />
        )}
      </div>
    );
  return (
    <PlannerCanvasPage
      key={selected.id}
      accountId={selected.id}
      accountControl={
        <AccountSwitcher
          accounts={banks}
          selectedAccountId={selected.id}
          onAccountChange={choice.selectAccount}
        />
      }
    />
  );
}
