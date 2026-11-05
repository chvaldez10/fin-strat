"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Button } from "@/components/ui/button";
import { useMoneyFlowPlan } from "../../persistence/use-money-flow-plan";
import type { MoneyFlowPlan } from "../../persistence/convex-types";
import { useWorkspaceLease } from "../../persistence/use-workspace-lease";
import { WorkspaceSessionBlocked } from "../../components/workspace/workspace-session-blocked";
import { usePlanner, type PlannerData } from "../use-planner";
import { PlannerCanvas } from "./planner-canvas";
import { PlannerLoading, MONEY_PATH } from "./planner-shell";
import { PaymentEditor } from "./payment-editor";
import { PlannerWriteContext } from "./planner-write-context";

type Info = NonNullable<FunctionReturnType<typeof api.plannerCanvas.get>>;
export function PlannerCanvasPage({ accountId }: { accountId: string }) {
  const planner = usePlanner(),
    legacy = useMoneyFlowPlan(),
    info = useQuery(api.plannerCanvas.get, { accountId });
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div>
          <h1 className="font-semibold">
            {info?.account.name ?? "Monthly canvas"}
          </h1>
          <p className="text-xs text-muted-foreground">
            The same monthly payments, shown as account flows.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href={MONEY_PATH}>Monthly planner</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link
              href={`${MONEY_PATH}/accounts/${encodeURIComponent(accountId)}`}
            >
              Account details
            </Link>
          </Button>
        </div>
      </header>
      {!info || !legacy.root ? (
        <PlannerLoading
          error={
            planner.error ||
            (!info && planner.data?.ready
              ? "This account canvas is unavailable."
              : "")
          }
          onRetry={planner.retry}
        />
      ) : (
        <CanvasSession
          root={legacy.root}
          info={info}
          data={planner.data}
          month={planner.month}
          onMonthChange={planner.setMonth}
          error={planner.error}
          retry={planner.retry}
        />
      )}
    </div>
  );
}
function CanvasSession({
  root,
  info,
  data,
  month,
  onMonthChange,
  error,
  retry,
}: {
  root: MoneyFlowPlan;
  info: Info;
  data: PlannerData | undefined;
  month: string;
  onMonthChange: (month: string) => void;
  error: string;
  retry: () => void;
}) {
  const lease = useWorkspaceLease(root, info.account.legacyAccountId!),
    [adding, setAdding] = useState(false);
  const active = lease.status === "active";
  if (lease.status === "checking")
    return <PlannerLoading error="" onRetry={retry} />;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!active ? (
        <WorkspaceSessionBlocked
          status={lease.status}
          onTakeControl={lease.takeControl}
          onBack={() => window.location.assign(`${MONEY_PATH}/accounts`)}
        />
      ) : !data?.ready || !lease.sessionId ? (
        <PlannerLoading error={error} onRetry={retry} />
      ) : (
        <PlannerWriteContext
          value={{
            identity: {
              documentId: root._id,
              accountId: info.account.legacyAccountId!,
              sessionId: lease.sessionId,
            },
            access: {
              sessionId: lease.sessionId,
              canWrite: lease.canWrite,
              onLost: lease.onLost,
            },
          }}
        >
          <PlannerCanvas
            key={lease.sessionId}
            account={info.account}
            accounts={data.accounts}
            items={data.entries}
            month={month}
            onMonthChange={onMonthChange}
            root={root}
            layout={info.layout}
            access={{
              sessionId: lease.sessionId,
              canWrite: lease.canWrite,
              onLost: lease.onLost,
            }}
            onAdd={() => setAdding(true)}
          />
          {adding && (
            <PaymentEditor
              month={month}
              accounts={data.accounts}
              initial={{ accountId: info.account.id }}
              onClose={() => setAdding(false)}
            />
          )}
        </PlannerWriteContext>
      )}
    </div>
  );
}
