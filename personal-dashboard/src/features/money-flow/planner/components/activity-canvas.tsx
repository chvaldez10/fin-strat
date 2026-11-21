import { useCallback, useMemo, useState, type ReactNode } from "react";
import { BackgroundVariant, Controls, ReactFlow } from "@xyflow/react";
import { ChevronLeft, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { CanvasGridBackground } from "../../components/canvas-grid-background";
import type {
  CanvasPositions,
  MoneyCanvasNode,
  PlannerEdge,
} from "../../canvas-types";
import { activityAccountName } from "../activity-canvas-account";
import type { ActivityFilter } from "../activity-data";
import {
  activityFlowItems,
  activityGroups,
  projectActivityCanvas,
  type ActivityCanvasView,
} from "../activity-projection";
import type { ActivityWorkspaceData } from "../activity-workspace-data";
import type { FinancialAccount } from "../types";
import {
  PlannerCanvasFrame,
  nodeTypes,
  edgeTypes,
  type CanvasFrameState,
} from "./planner-canvas-frame";

export function ActivityCanvas({
  frame,
  month,
  onMonthChange,
  account,
  openExpenses,
  accountControl,
  hasAccounts,
  workspace,
  summary,
  onActivity,
  onLogBill,
}: Readonly<{
  frame?: CanvasFrameState;
  month: string;
  onMonthChange: (month: string) => void;
  account?: FinancialAccount;
  openExpenses: boolean;
  accountControl?: ReactNode;
  hasAccounts: boolean;
  workspace: ActivityWorkspaceData;
  summary: ReactNode;
  onActivity: (filter?: ActivityFilter, view?: "scheduled") => void;
  onLogBill?: () => void;
}>) {
  const accountId = account?.id;
  const [selection, setSelection] = useState<{
    accountId?: string;
    view: ActivityCanvasView;
  }>(() => ({ accountId, view: openExpenses ? "expenses" : "overview" }));
  const view = selection?.accountId === accountId ? selection.view : "overview";
  const group = view === "overview" ? undefined : activityGroups[view];
  const openView = (next: ActivityCanvasView) =>
    setSelection({ accountId, view: next });
  const openGroupTransactions = () => {
    if (group) onActivity(group.filter);
  };
  const items = useMemo(
    () => activityFlowItems(workspace, view, account),
    [workspace, view, account]
  );
  const project = useCallback(
    (positions: CanvasPositions) =>
      projectActivityCanvas(workspace, view, account, items, positions),
    [workspace, view, account, items]
  );
  const fallback = useMemo(
    () => (frame ? null : project({})),
    [frame, project]
  );
  const activate = (id: string) => {
    if (id === "center") onActivity();
    else if (id === `${view}-center`) openGroupTransactions();
    else {
      const item = items.find((item) => item.id === id);
      if (!item) return false;
      if (item.group) openView(item.group);
      else onActivity(item.filter, item.initialView);
    }
    return true;
  };
  const header = (
    <>
      {group && (
        <Button variant="ghost" size="sm" onClick={() => openView("overview")}>
          <ChevronLeft aria-hidden="true" /> Overview
        </Button>
      )}
      <h1
        className={
          !group && accountControl ? "sr-only" : "mr-2 text-sm font-semibold"
        }
      >
        {group?.label ?? activityAccountName(account)}
      </h1>
      {accountControl && (
        <div className="w-full sm:w-auto">{accountControl}</div>
      )}
      {view === "household" && onLogBill && (
        <Button size="sm" onClick={onLogBill}>
          <Plus aria-hidden="true" /> Log bill
        </Button>
      )}
      {group && (
        <Button size="sm" variant="outline" onClick={openGroupTransactions}>
          <List aria-hidden="true" /> View transactions
        </Button>
      )}
    </>
  );
  if (frame) {
    return (
      <PlannerCanvasFrame
        {...frame}
        scope="activity"
        viewKey={view}
        layoutNamespace={account ? `bank:${account.id}:` : ""}
        header={header}
        summary={summary}
        tools={(moveControl) =>
          moveControl && (
            <div className="absolute bottom-4 left-4 z-20 rounded-lg border bg-card p-1 shadow-sm">
              {moveControl}
            </div>
          )
        }
        project={project}
        onActivate={activate}
        inspect={() => null}
        interactionHint={
          group
            ? "Click a card to see its transactions."
            : "Click Household bills or Expenses to open its canvas."
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-6">
        {header}
        <div className="w-full sm:w-auto">
          <MonthPicker
            aria-label="Activity month"
            value={month}
            onValueChange={onMonthChange}
          />
        </div>
      </div>
      {summary}
      {!hasAccounts ? (
        <p className="p-6 text-sm text-muted-foreground">
          Add an account to see its monthly activity.
        </p>
      ) : (
        fallback && (
          <div className="min-h-64 flex-1">
            <ReactFlow<MoneyCanvasNode, PlannerEdge>
              key={`${accountId ?? "all"}:${view}`}
              nodes={fallback.nodes}
              edges={fallback.edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesFocusable={false}
              deleteKeyCode={null}
              minZoom={0.2}
              maxZoom={2}
              onNodeClick={(_, node) => activate(node.id)}
              onKeyDownCapture={(event) => {
                if (
                  event.key !== "Enter" ||
                  !(event.target instanceof HTMLElement)
                )
                  return;
                const id =
                  event.target.closest<HTMLElement>(".react-flow__node")
                    ?.dataset.id;
                if (id && activate(id)) event.preventDefault();
              }}
            >
              <CanvasGridBackground variant={BackgroundVariant.Dots} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        )
      )}
    </div>
  );
}
