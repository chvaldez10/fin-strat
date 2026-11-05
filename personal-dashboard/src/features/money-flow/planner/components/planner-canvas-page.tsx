"use client";
import { useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { useMoneyFlowPlan } from "../../persistence/use-money-flow-plan";
import type { MoneyFlowPlan } from "../../persistence/convex-types";
import { useWorkspaceLease } from "../../persistence/use-workspace-lease";
import { WorkspaceSessionBlocked } from "../../components/workspace/workspace-session-blocked";
import { usePlanner, type PlannerData } from "../use-planner";
import { PlannerCanvas } from "./planner-canvas";
import { PlannerLoading, MONEY_PATH } from "./planner-shell";
import { PaymentEditor } from "./payment-editor";
import { PlannerWriteContext } from "./planner-write-context";
import { CanvasBudgetSummary } from "./canvas-budget-summary";
import { MoneyNavigation } from "./money-navigation";

type Info = NonNullable<FunctionReturnType<typeof api.plannerCanvas.get>>;
export function PlannerCanvasPage({
  accountId,
  accountControl,
}: {
  accountId: string;
  accountControl?: ReactNode;
}) {
  const planner = usePlanner(),
    legacy = useMoneyFlowPlan(),
    info = useQuery(api.plannerCanvas.get, { accountId });
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col">
      <MoneyNavigation page="canvas" month={planner.month} />
      {accountControl && <h1 className="sr-only">Monthly canvas</h1>}
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
          accountControl={accountControl}
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
  accountControl,
  root,
  info,
  data,
  month,
  onMonthChange,
  error,
  retry,
}: {
  accountControl?: ReactNode;
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
            accountControl={accountControl}
            summary={<CanvasBudgetSummary data={data} month={month} />}
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
