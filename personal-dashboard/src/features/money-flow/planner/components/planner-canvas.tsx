"use client";
import {
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
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { projectMonthlyCanvas } from "../canvas-projection";
import type { FinancialAccount, Payment } from "../types";
import {
  PlannerElementConnection,
  type PlannerEdge,
} from "./planner-element-connection";
import { PlannerElementInspector } from "./planner-element-inspector";

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
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
        <div className="flex flex-wrap gap-2">
          <MonthPicker
            aria-label="Canvas month"
            disabled={state.pending !== null}
            value={month}
            onValueChange={(value) => {
              if (state.status === "saved") onMonthChange(value);
            }}
          />
          <Button variant="outline" onClick={onAdd}>
            Add payment
          </Button>
          <Button
            variant="ghost"
            aria-pressed={grid}
            onClick={() => setGrid((v) => !v)}
          >
            {grid ? "Hide grid" : "Show grid"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => void instance.current?.fitView({ padding: 0.2 })}
          >
            Fit view
          </Button>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
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
      <div className="relative min-h-96 flex-1">
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
        </ReactFlow>
        <p className="pointer-events-none absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground">
          Drag empty space to pan. Click an expense, including a credit-card
          payment, to edit its shared record.
        </p>
      </div>
      {selected && projection.groups.get(selected) && (
        <PlannerElementInspector
          items={projection.groups.get(selected)!}
          accounts={accounts}
          month={month}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
