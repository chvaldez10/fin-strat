"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import { Move, type LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { MoneyFlowPlan } from "../../persistence/convex-types";
import type { WorkspaceWriteAccess } from "../../persistence/workspace-write-access";
import type { MoneyCanvasNode } from "../../canvas-types";
import { MoneyElement } from "../../components/money-element";
import { CanvasViewControls } from "../../components/canvas-view-controls";
import { CanvasToolButton } from "../../components/canvas-tool-button";
import { CanvasMenu, CanvasMenuAction } from "../../components/canvas-menu";
import { SNAP_GRID } from "../../components/canvas-grid";
import { CanvasGridBackground } from "../../components/canvas-grid-background";
import { hiddenElementLayoutKey } from "../layout-visibility";
import {
  usePlannerLayout,
  type PlannerLayout,
  type PlannerLayoutValues,
  type CanvasPlacement,
} from "../use-planner-layout";
import { CanvasLayoutStatus, CanvasMonthPicker } from "./canvas-layout-status";
import type { FinancialAccount } from "../types";
import {
  PlannerElementConnection,
  type PlannerEdge,
} from "./planner-element-connection";

const nodeTypes = {
  income: MoneyElement,
  expense: MoneyElement,
  chequing: MoneyElement,
  account: MoneyElement,
  note: MoneyElement,
};
const edgeTypes = { planner: PlannerElementConnection };
export type CanvasLayoutActions = Readonly<{
  place: (id: string, positionFor: CanvasPlacement, focusId?: string) => void;
  remove: (id: string) => void;
  isHidden: (id: string) => boolean;
  setHidden: (id: string, hidden: boolean) => void;
}>;

export type CanvasElementAction = Readonly<{
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
}>;

export type CanvasFrameState = Readonly<{
  account: FinancialAccount;
  month: string;
  onMonthChange: (month: string) => void;
  root: MoneyFlowPlan;
  layout: PlannerLayout;
  access: WorkspaceWriteAccess;
}>;

export function PlannerCanvasFrame({
  account,
  month,
  onMonthChange,
  root,
  layout,
  access,
  scope,
  header,
  summary,
  tools,
  project,
  viewKey = "overview",
  layoutNamespace = "",
  onActivate,
  elementActions,
  inspect,
}: CanvasFrameState &
  Readonly<{
    scope?: "activity";
    viewKey?: string;
    layoutNamespace?: string;
    /** Return true when activating a node navigates instead of opening its inspector. */
    onActivate?: (nodeId: string, layout: CanvasLayoutActions) => boolean;
    elementActions?: (
      nodeId: string,
      edit: () => void,
      layout: CanvasLayoutActions
    ) => CanvasElementAction[];
    header: ReactNode;
    summary?: ReactNode;
    tools: (moveControl: ReactNode, layout: CanvasLayoutActions) => ReactNode;
    project: (positions: PlannerLayoutValues["positions"]) => {
      nodes: MoneyCanvasNode[];
      edges: PlannerEdge[];
    };
    inspect: (
      nodeId: string,
      close: () => void,
      layout: CanvasLayoutActions
    ) => ReactNode;
  }>) {
  const mobile = useIsMobile();
  const [arranging, setArranging] = useState(false);
  const [grid, setGrid] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const changeMonth = useCallback(
    (value: string) => {
      setSelected(null);
      closeMenu();
      onMonthChange(value);
    },
    [closeMenu, onMonthChange]
  );
  const instance =
    useRef<ReactFlowInstance<MoneyCanvasNode, PlannerEdge>>(null);
  const cameraKey = layoutNamespace + viewKey;
  const activeView = useRef(cameraKey);
  const viewports = useRef(new Map<string, Viewport>());
  const savedOverview = useRef(layout?.viewport ?? { x: 0, y: 0, zoom: 0.8 });
  const viewportToSave = useCallback(
    (current: Viewport) =>
      activeView.current === "overview"
        ? current
        : (viewports.current.get("overview") ?? savedOverview.current),
    []
  );
  const persistence = usePlannerLayout({
    account,
    root,
    layout,
    access,
    instance,
    scope,
    viewportToSave,
    layoutNamespace,
  });
  const { positions, captureViewport } = persistence;
  const localPositions = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(positions)
          .filter(([id]) =>
            layoutNamespace
              ? id.startsWith(layoutNamespace)
              : !id.startsWith("bank:")
          )
          .map(([id, position]) => [id.slice(layoutNamespace.length), position])
      ),
    [positions, layoutNamespace]
  );
  const layoutId = (id: string) => layoutNamespace + id;
  const [focusPlacement, setFocusPlacement] = useState<string | null>(null);
  const layoutActions: CanvasLayoutActions = {
    place: (id, positionFor, focusId = id) => {
      if (
        persistence.placeElement(layoutId(id), () =>
          positionFor(localPositions)
        )
      )
        setFocusPlacement(focusId);
    },
    remove: (id) => persistence.removePlacement(layoutId(id)),
    isHidden: (id) => !!localPositions[hiddenElementLayoutKey(id)],
    setHidden: (id, hidden) => {
      const key = layoutId(hiddenElementLayoutKey(id));
      if (hidden) persistence.placeElement(key, () => ({ x: 0, y: 0 }));
      else {
        persistence.removePlacement(key);
        setFocusPlacement(id);
      }
    },
  };
  const projection = useMemo(
    () => project(localPositions),
    [project, localPositions]
  );
  const menuNode = menu && projection.nodes.find((node) => node.id === menu.id);
  const actions = menuNode
    ? elementActions?.(
        menuNode.id,
        () => setSelected(menuNode.id),
        layoutActions
      )
    : undefined;
  const openMenu = (id: string, clientX: number, clientY: number) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (bounds) {
      setMenu({ id, x: clientX - bounds.left, y: clientY - bounds.top });
    }
  };
  const activateElement = (id: string) => {
    if (onActivate?.(id, layoutActions)) setSelected(null);
    else if (id !== "center") setSelected(id);
  };
  useEffect(() => {
    const flow = instance.current;
    if (!flow) return;
    const changedView = activeView.current !== cameraKey;
    if (changedView) {
      viewports.current.set(activeView.current, flow.getViewport());
      activeView.current = cameraKey;
      setSelected(null);
      closeMenu();
    }
    flow.setNodes((current) => {
      const previous = new Map(current.map((node) => [node.id, node]));
      return projection.nodes.map((node) => ({
        ...previous.get(node.id),
        ...node,
        position:
          changedView ||
          (scope === "activity" &&
            node.data.kind === "income" &&
            !previous.get(node.id)?.dragging)
            ? node.position
            : (previous.get(node.id)?.position ?? node.position),
      }));
    });
    flow.setEdges(projection.edges);
    if (changedView) {
      setFocusPlacement(null);
      const viewport =
        viewports.current.get(cameraKey) ??
        (cameraKey === "overview" && layout?.revision
          ? savedOverview.current
          : undefined);
      if (viewport) void flow.setViewport(viewport);
      else void flow.fitView({ padding: 0.2 });
    } else if (
      focusPlacement &&
      projection.nodes.some((node) => node.id === focusPlacement)
    ) {
      void flow.fitView({ padding: 0.2 }).then(() => {
        captureViewport();
        setFocusPlacement((current) =>
          current === focusPlacement ? null : current
        );
      });
    }
  }, [
    projection,
    cameraKey,
    scope,
    captureViewport,
    focusPlacement,
    closeMenu,
    layout?.viewport,
    layout?.revision,
  ]);
  return (
    <TooltipProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            {header}
            <CanvasMonthPicker
              queue={persistence.queue}
              month={month}
              onMonthChange={changeMonth}
            />
          </div>
          <CanvasLayoutStatus
            queue={persistence.queue}
            onRetry={persistence.retry}
          />
        </div>
        {summary}
        <div
          ref={canvasRef}
          className="relative min-h-64 flex-1 touch-none overscroll-contain"
        >
          {tools(
            mobile && (
              <CanvasToolButton
                label="Move elements"
                aria-pressed={arranging}
                variant={arranging ? "secondary" : "ghost"}
                onClick={() => setArranging((value) => !value)}
              >
                <Move aria-hidden="true" />
              </CanvasToolButton>
            ),
            layoutActions
          )}
          <ReactFlow<MoneyCanvasNode, PlannerEdge>
            defaultNodes={projection.nodes}
            defaultEdges={projection.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(flow) => {
              instance.current = flow;
            }}
            onNodeDragStop={(_, node) =>
              persistence.moveElement({
                id: layoutId(node.id),
                position: node.position,
              })
            }
            onMoveStart={(event) => {
              persistence.cancelTimer();
              if (event) closeMenu();
            }}
            onMoveEnd={(event) => {
              if (event) persistence.captureViewport();
            }}
            onNodeClick={(_, node) => activateElement(node.id)}
            onNodeContextMenu={
              elementActions &&
              ((event, node) => {
                event.preventDefault();
                if (event.currentTarget instanceof HTMLElement)
                  event.currentTarget.focus({ preventScroll: true });
                openMenu(node.id, event.clientX, event.clientY);
              })
            }
            onKeyDownCapture={
              elementActions &&
              ((event) => {
                const openActions =
                  event.key === "ContextMenu" ||
                  (event.shiftKey && event.key === "F10");
                if (!openActions && event.key !== "Enter") return;
                const target = event.target;
                if (
                  !(target instanceof HTMLElement) ||
                  !target.matches(".react-flow__node")
                )
                  return;
                const id = target.dataset.id;
                if (!id) return;
                event.preventDefault();
                event.stopPropagation();
                if (!openActions) {
                  if (!event.repeat) activateElement(id);
                  return;
                }
                const bounds = target.getBoundingClientRect();
                openMenu(id, bounds.left, bounds.bottom);
              })
            }
            onPaneClick={() => setSelected(null)}
            defaultViewport={
              (!layoutNamespace && layout?.viewport) || {
                x: 0,
                y: 0,
                zoom: 0.8,
              }
            }
            fitView={!!layoutNamespace || !layout || layout.revision === 0}
            fitViewOptions={{ padding: 0.2 }}
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
            snapGrid={SNAP_GRID}
            onlyRenderVisibleElements
          >
            {grid && <CanvasGridBackground />}
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
              onReset={() =>
                void persistence.restorePositions(cameraKey !== "overview")
              }
              resetLabel="Restore loaded positions"
            />
          </ReactFlow>
          <p className="pointer-events-none absolute bottom-20 left-4 hidden max-w-[calc(100%-2rem)] rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground md:block">
            Drag empty space to pan.{" "}
            {elementActions
              ? "Right-click an element for actions."
              : "Click an element to edit."}
          </p>
          {mobile && arranging && (
            <output className="pointer-events-none absolute bottom-24 left-4 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground">
              Drag elements to move them. Turn off Move elements to pan.
            </output>
          )}

          {selected &&
            inspect(
              selected,
              () =>
                setSelected((current) =>
                  current === selected ? null : current
                ),
              layoutActions
            )}
          {menu && menuNode && !!actions?.length && (
            <CanvasMenu
              x={menu.x}
              y={menu.y}
              title={menuNode.data.label}
              label={`Actions for ${menuNode.data.label}`}
              onClose={closeMenu}
              testId="money-flow-node-menu"
            >
              {actions.map(({ label, icon: Icon, destructive, onSelect }) => (
                <CanvasMenuAction
                  key={label}
                  destructive={destructive}
                  onClick={() => {
                    closeMenu();
                    setSelected(null);
                    onSelect();
                  }}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </CanvasMenuAction>
              ))}
            </CanvasMenu>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
