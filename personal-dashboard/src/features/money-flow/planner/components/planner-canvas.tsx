"use client";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import type { MoneyFlowPlan } from "../../persistence/convex-types";
import type { WorkspaceWriteAccess } from "../../persistence/workspace-write-access";
import { withWorkspaceAccess } from "../../persistence/workspace-write-access";
import { SaveQueue } from "../../persistence/save-queue";
import type { MoneyCanvasNode } from "../../canvas-types";
import { MoneyElement } from "../../components/money-element";
import { CanvasViewControls } from "../../components/canvas-view-controls";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { MonthPicker } from "@/components/ui/month-picker";
import { projectMonthlyCanvas } from "../canvas-projection";
import type { FinancialAccount, Payment } from "../types";
import {
  PlannerElementConnection,
  type PlannerEdge,
} from "./planner-element-connection";
import { PlannerElementInspector } from "./planner-element-inspector";
import { MONEY_PATH } from "./money-navigation";
import { monthLink } from "../use-planner-month";

type Layout = NonNullable<
  FunctionReturnType<typeof api.plannerCanvas.get>
>["layout"];
const nodeTypes = {
  income: MoneyElement,
  expense: MoneyElement,
  chequing: MoneyElement,
  account: MoneyElement,
  note: MoneyElement,
};
const edgeTypes = { planner: PlannerElementConnection };
export function PlannerCanvas({
  accountControl,
  summary,
  account,
  accounts,
  items,
  month,
  onMonthChange,
  root,
  layout,
  access,
  onAdd,
}: {
  accountControl?: ReactNode;
  summary?: ReactNode;
  account: FinancialAccount;
  accounts: FinancialAccount[];
  items: Payment[];
  month: string;
  onMonthChange: (month: string) => void;
  root: MoneyFlowPlan;
  layout: Layout;
  access: WorkspaceWriteAccess;
  onAdd: () => void;
}) {
  const [positions, setPositions] = useState(layout?.positions ?? {}),
    [grid, setGrid] = useState(true),
    [selected, setSelected] = useState<string | null>(null);
  const [loadedLayout] = useState(() => ({
    positions: layout?.positions ?? {},
    viewport: layout?.viewport ?? { x: 0, y: 0, zoom: 0.8 },
  }));
  const instance =
      useRef<ReactFlowInstance<MoneyCanvasNode, PlannerEdge>>(null),
    save = useMutation(api.plannerCanvas.saveLayout);
  const [queue] = useState(
    () =>
      new SaveQueue(
        layout?.revision ?? 0,
        async (
          values: {
            positions: Record<string, { x: number; y: number }>;
            viewport: Viewport;
          },
          revision: number
        ) =>
          withWorkspaceAccess(access, () =>
            save({
              documentId: root._id,
              accountId: account.legacyAccountId!,
              sessionId: access.sessionId,
              expectedRevision: revision,
              values,
            })
          )
      )
  );
  const state = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot
  );
  const projection = useMemo(
    () => projectMonthlyCanvas(account, items, positions),
    [account, items, positions]
  );
  useEffect(() => {
    const flow = instance.current;
    if (!flow) return;
    flow.setNodes((current) => {
      const previous = new Map(current.map((node) => [node.id, node]));
      return projection.nodes.map((node) => ({
        ...previous.get(node.id),
        ...node,
        position: previous.get(node.id)?.position ?? node.position,
      }));
    });
    flow.setEdges(projection.edges as PlannerEdge[]);
  }, [projection]);
  function capture() {
    const flow = instance.current;
    if (!flow || !access.canWrite()) return;
    queue.enqueue({
      positions: {
        ...positions,
        ...Object.fromEntries(
          flow.getNodes().map((node) => [node.id, node.position])
        ),
      },
      viewport: flow.getViewport(),
    });
  }
  async function restorePositions() {
    const flow = instance.current;
    if (!flow) return;
    flow.setNodes((current) =>
      current.map((node) => ({
        ...node,
        position: loadedLayout.positions[node.id] ?? node.position,
      }))
    );
    setPositions(loadedLayout.positions);
    await flow.setViewport(loadedLayout.viewport);
    window.requestAnimationFrame(() => {
      if (!access.canWrite()) return;
      queue.enqueue({
        positions: {
          ...loadedLayout.positions,
          ...Object.fromEntries(
            flow.getNodes().map((node) => [node.id, node.position])
          ),
        },
        viewport: flow.getViewport(),
      });
    });
  }
  return (
    <TooltipProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
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
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <MonthPicker
                aria-label="Canvas month"
                className="min-w-0 flex-1 sm:w-auto sm:min-w-44 sm:flex-none"
                disabled={state.pending !== null}
                value={month}
                onValueChange={(value) => {
                  if (state.status === "saved") onMonthChange(value);
                }}
              />
              <Button variant="outline" onClick={onAdd}>
                <Plus aria-hidden="true" />
                Add payment
              </Button>
            </div>
          </div>
          <span
            className={`${state.status === "saved" ? "sr-only sm:not-sr-only" : ""} text-xs text-muted-foreground`}
            aria-live="polite"
          >
            {state.status === "saved"
              ? "Layout saved"
              : state.status === "saving"
                ? "Saving layout…"
                : "Layout not saved"}
          </span>
          {state.status === "failed" && (
            <Button size="sm" onClick={() => void queue.retry()}>
              Retry layout save
            </Button>
          )}
          {state.status === "conflict" && (
            <p className="text-xs text-destructive">
              Layout changed elsewhere. Refresh to load its saved positions.
            </p>
          )}
        </div>
        {summary}
        <div className="relative min-h-64 flex-1">
          <ReactFlow<MoneyCanvasNode, PlannerEdge>
            defaultNodes={projection.nodes}
            defaultEdges={projection.edges as PlannerEdge[]}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(flow) => {
              instance.current = flow;
            }}
            onNodeDragStop={(_, node) => {
              setPositions((current) => ({
                ...current,
                [node.id]: node.position,
              }));
              capture();
            }}
            onMoveEnd={capture}
            onNodeClick={(_, node) => {
              if (node.id !== "center") setSelected(node.id);
            }}
            onPaneClick={() => setSelected(null)}
            defaultViewport={layout?.viewport ?? { x: 0, y: 0, zoom: 0.8 }}
            fitView={!layout || layout.revision === 0}
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "var(--muted-foreground)",
              },
            }}
            nodesConnectable={false}
            edgesFocusable={false}
            deleteKeyCode={null}
            selectionOnDrag={false}
            panOnDrag={[0, 1]}
            minZoom={0.3}
            maxZoom={2}
            snapToGrid
            snapGrid={[24, 24]}
            onlyRenderVisibleElements
          >
            {grid && (
              <Background
                variant={BackgroundVariant.Lines}
                gap={24}
                lineWidth={1}
                color="color-mix(in oklab, var(--foreground) 20%, transparent)"
              />
            )}
            <CanvasViewControls
              inspectorOpen={!!selected}
              gridVisible={grid}
              onToggleGrid={() => setGrid((value) => !value)}
              onFitView={() => void instance.current?.fitView({ padding: 0.2 })}
              onZoomIn={() => void instance.current?.zoomIn()}
              onZoomOut={() => void instance.current?.zoomOut()}
              onReset={() => void restorePositions()}
              resetLabel="Restore loaded positions"
            />
          </ReactFlow>
          <p className="pointer-events-none absolute bottom-20 left-4 hidden max-w-[calc(100%-2rem)] rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground md:block">
            Drag empty space to pan. Click an element to edit.
          </p>
          {selected && projection.groups.get(selected) && (
            <PlannerElementInspector
              items={projection.groups.get(selected)!}
              accounts={accounts}
              month={month}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
