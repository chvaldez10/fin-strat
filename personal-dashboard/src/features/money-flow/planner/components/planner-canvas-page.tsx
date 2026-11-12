"use client";
import { useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import type { MoneyFlowPlan } from "../../persistence/convex-types";
import { useWorkspaceLease } from "../../persistence/use-workspace-lease";
import { WorkspaceSessionBlocked } from "../../components/workspace/workspace-session-blocked";
import {
  usePlanner,
  usePlannerMetadata,
  type PlannerData,
} from "../use-planner";
import { PlannerCanvas } from "./planner-canvas";
import { PlannerLoading, MONEY_PATH } from "./planner-shell";
import { CanvasElementEditor } from "./canvas-element-editor";
import type { PaymentKind } from "../types";
import { PlannerWriteContext } from "./planner-write-context";
import { CanvasBudgetSummary } from "./canvas-budget-summary";
import type { ActivityData } from "../activity-data";
import { ActivityWorkspace } from "./activity-workspace";

type Info = NonNullable<FunctionReturnType<typeof api.plannerCanvas.get>>;
type ActivityView = Readonly<{ data: ActivityData | undefined }>;
export function PlannerCanvasPage({
  accountId,
  accountControl,
  activity,
}: Readonly<{
  accountId: string;
  accountControl?: ReactNode;
  activity?: ActivityView;
}>) {
  const planner = usePlanner(),
    legacy = usePlannerMetadata(),
    info = useQuery(api.plannerCanvas.get, {
      accountId,
      scope: activity ? "activity" : undefined,
    });
  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
          activity={activity}
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
  activity,
  root,
  info,
  data,
  month,
  onMonthChange,
  error,
  retry,
}: Readonly<{
  accountControl?: ReactNode;
  activity?: ActivityView;
  root: MoneyFlowPlan;
  info: Info;
  data: PlannerData | undefined;
  month: string;
  onMonthChange: (month: string) => void;
  error: string;
  retry: () => void;
}>) {
  const lease = useWorkspaceLease(root, info.account.legacyAccountId!),
    [adding, setAdding] = useState<PaymentKind | null>(null);
  const active = lease.status === "active";
  const access = {
    sessionId: lease.sessionId ?? "",
    canWrite: lease.canWrite,
    onLost: lease.onLost,
  };
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
      ) : !data?.ready || !lease.sessionId || (activity && !activity.data) ? (
        <PlannerLoading error={error} onRetry={retry} />
      ) : (
        <PlannerWriteContext
          value={{
            identity: {
              documentId: root._id,
              accountId: info.account.legacyAccountId!,
              sessionId: lease.sessionId,
            },
            access,
          }}
        >
          {activity?.data ? (
            <ActivityWorkspace
              key={lease.sessionId}
              month={month}
              onMonthChange={onMonthChange}
              data={activity.data}
              accounts={data.accounts}
              plans={data.entries}
              frame={{
                account: info.account,
                root,
                layout: info.layout,
                access,
                month,
                onMonthChange,
              }}
            />
          ) : (
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
              access={access}
              onAdd={setAdding}
            />
          )}
          {adding && (
            <CanvasElementEditor
              key={adding}
              kind={adding}
              month={month}
              accounts={data.accounts}
              sourceAccountId={info.account.id}
              onClose={() => setAdding(null)}
            />
          )}
        </PlannerWriteContext>
      )}
    </div>
  );
}
