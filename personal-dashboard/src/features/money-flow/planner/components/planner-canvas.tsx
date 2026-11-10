"use client";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { MoneyFlowPlan } from "../../persistence/convex-types";
import type { WorkspaceWriteAccess } from "../../persistence/workspace-write-access";
import type { MoneyCanvasNode } from "../../canvas-types";
import { MoneyElement } from "../../components/money-element";
import { CanvasViewControls } from "../../components/canvas-view-controls";
import { ElementToolbar } from "../../components/element-toolbar";
import { CanvasToolButton } from "../../components/canvas-tool-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard, Move, Settings2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlannerLayout, type PlannerLayout } from "../use-planner-layout";
import { CanvasLayoutStatus, CanvasMonthPicker } from "./canvas-layout-status";
import { projectMonthlyCanvas } from "../canvas-projection";
import type { FinancialAccount, Payment, PaymentKind } from "../types";
import {
  PlannerElementConnection,
  type PlannerEdge,
} from "./planner-element-connection";
import { PlannerElementInspector } from "./planner-element-inspector";
import { MONEY_PATH } from "./money-navigation";
import { monthLink } from "../use-planner-month";

const nodeTypes = {
  income: MoneyElement,
  expense: MoneyElement,
  chequing: MoneyElement,
  account: MoneyElement,
  note: MoneyElement,
};
const edgeTypes = { planner: PlannerElementConnection };
const plannerTools = [
  { kind: "income", label: "Add income" },
  { kind: "expense", label: "Add expense" },
  { kind: "account", label: "Add savings or transfer" },
] as const;
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
}: Readonly<{
  accountControl?: ReactNode;
  summary?: ReactNode;
  account: FinancialAccount;
  accounts: FinancialAccount[];
  items: Payment[];
  month: string;
  onMonthChange: (month: string) => void;
  root: MoneyFlowPlan;
  layout: PlannerLayout;
  access: WorkspaceWriteAccess;
  onAdd: (kind: PaymentKind) => void;
}>) {
  const mobile = useIsMobile();
  const [arranging, setArranging] = useState(false);
  const [grid, setGrid] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const instance =
    useRef<ReactFlowInstance<MoneyCanvasNode, PlannerEdge>>(null);
  const persistence = usePlannerLayout({
    account,
    root,
    layout,
    access,
    instance,
  });
  const { positions } = persistence;
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
              <CanvasMonthPicker
                queue={persistence.queue}
                month={month}
                onMonthChange={onMonthChange}
              />
            </div>
          </div>
          <CanvasLayoutStatus
            queue={persistence.queue}
            onRetry={persistence.retry}
          />
        </div>
        {summary}
        <div className="relative min-h-64 flex-1 touch-none overscroll-contain">
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
            {mobile && (
              <>
                <span
                  className="mx-1 h-6 w-px shrink-0 bg-border"
                  aria-hidden="true"
                />
                <CanvasToolButton
                  label="Move elements"
                  aria-pressed={arranging}
                  variant={arranging ? "secondary" : "ghost"}
                  onClick={() => setArranging((value) => !value)}
                >
                  <Move aria-hidden="true" />
                </CanvasToolButton>
              </>
            )}
          </ElementToolbar>
          <ReactFlow<MoneyCanvasNode, PlannerEdge>
            defaultNodes={projection.nodes}
            defaultEdges={projection.edges as PlannerEdge[]}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(flow) => {
              instance.current = flow;
            }}
            onNodeDragStop={(_, node) => persistence.moveElement(node)}
            onMoveStart={persistence.cancelTimer}
            onMoveEnd={(event) => {
              if (event) persistence.captureViewport();
            }}
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
            panOnDrag={mobile ? true : [0, 1]}
            nodesDraggable={!mobile || arranging}
            nodeDragThreshold={mobile ? 10 : 3}
            nodeClickDistance={mobile ? 8 : 0}
            paneClickDistance={mobile ? 8 : 0}
            zoomOnPinch
            zoomOnDoubleClick={!mobile}
            preventScrolling
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
              onFitView={() =>
                void instance.current
                  ?.fitView({ padding: 0.2 })
                  .then(persistence.captureViewport)
              }
              onZoomIn={() =>
                void instance.current
                  ?.zoomIn()
                  .then(persistence.captureViewport)
              }
              onZoomOut={() =>
                void instance.current
                  ?.zoomOut()
                  .then(persistence.captureViewport)
              }
              onReset={() => void persistence.restorePositions()}
              resetLabel="Restore loaded positions"
            />
          </ReactFlow>
          <p className="pointer-events-none absolute bottom-20 left-4 hidden max-w-[calc(100%-2rem)] rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground md:block">
            Drag empty space to pan. Click an element to edit.
          </p>
          {mobile && arranging && (
            <output className="pointer-events-none absolute bottom-24 left-4 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground">
              Drag elements to move them. Turn off Move elements to pan.
            </output>
          )}
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
